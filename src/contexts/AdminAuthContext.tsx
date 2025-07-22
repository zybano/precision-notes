import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: {
    organizations?: boolean;
    analytics?: boolean;
    settings?: boolean;
    users?: boolean;
  };
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  sessionToken: string | null;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'admin_session_token';

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const storedToken = localStorage.getItem(ADMIN_SESSION_KEY);
      if (storedToken) {
        const isValid = await validateSession(storedToken);
        if (!isValid) {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  const validateSession = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_admin_session', {
        p_session_token: token
      });

      if (error) {
        console.error('Session validation error:', error);
        return false;
      }

      if (data && data.length > 0) {
        const adminData = data[0];
        setAdminUser({
          id: adminData.admin_id,
          name: adminData.name,
          email: adminData.email,
          role: adminData.role,
          permissions: adminData.permissions
        });
        setSessionToken(token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Check if admin functions are available
      try {
        // First, verify admin credentials
        const { data: credentials, error: credError } = await supabase.rpc('verify_admin_credentials', {
          p_email: email,
          p_password: password
        });

        if (credError) {
          console.error('Credential verification error:', credError);
          
          // Check if it's a function not found error
          if (credError.message?.includes('function') && credError.message?.includes('does not exist')) {
            toast.error('Admin authentication not set up. Please run the SQL setup script.');
            return false;
          }
          
          toast.error('Invalid credentials');
          return false;
        }

        if (!credentials || credentials.length === 0) {
          toast.error('Invalid email or password');
          return false;
        }

        const adminData = credentials[0];

        if (!adminData.is_active) {
          toast.error('Account is disabled');
          return false;
        }

        // Generate session token without needing Supabase auth
        const sessionTokenValue = `admin_${adminData.admin_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create admin session with a placeholder auth user ID
        const placeholderAuthId = `admin_${adminData.admin_id}_${Date.now()}`;

        const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session', {
          p_admin_user_id: adminData.admin_id,
          p_auth_user_id: placeholderAuthId,
          p_session_token: sessionTokenValue,
          p_ip_address: null, // Could be populated with actual IP
          p_user_agent: navigator.userAgent
        });

        if (sessionError) {
          console.error('Session creation error:', sessionError);
          toast.error('Failed to create session');
          return false;
        }

        // Store session token
        localStorage.setItem(ADMIN_SESSION_KEY, sessionTokenValue);
        setSessionToken(sessionTokenValue);

        // Set admin user
        setAdminUser({
          id: adminData.admin_id,
          name: adminData.name,
          email: email,
          role: adminData.role,
          permissions: adminData.permissions
        });

        toast.success(`Welcome back, ${adminData.name}!`);
        return true;

      } catch (functionError) {
        console.error('Admin function error:', functionError);
        toast.error('Admin system not configured. Please contact administrator.');
        return false;
      }

    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('An error occurred during sign in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (sessionToken) {
        // Invalidate session in database
        await supabase.rpc('logout_admin_session', {
          p_session_token: sessionToken
        });
      }

      // Clear local state (no need to sign out from Supabase auth since we didn't use it)
      localStorage.removeItem(ADMIN_SESSION_KEY);
      setAdminUser(null);
      setSessionToken(null);

      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    
    // Super admins have all permissions
    if (adminUser.role === 'super_admin') return true;
    
    // Check specific permission
    return adminUser.permissions[permission as keyof typeof adminUser.permissions] === true;
  };

  return (
    <AdminAuthContext.Provider value={{
      adminUser,
      isLoading,
      signIn,
      signOut,
      sessionToken,
      hasPermission
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  validateSession: (token: string) => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('admin_session_token');
    if (token) {
      validateSession(token).then((isValid) => {
        if (!isValid) {
          localStorage.removeItem('admin_session_token');
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const validateSession = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_admin_session', {
        p_session_token: token
      });

      if (error || !data || data.length === 0) {
        console.log('Session validation failed:', error);
        return false;
      }

      const sessionData = data[0];
      
      setUser({
        id: sessionData.admin_id,
        name: sessionData.name,
        email: sessionData.email,
        role: sessionData.role,
        permissions: sessionData.permissions,
      });

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_email: email,
        p_password: password
      });

      if (error || !data || data.length === 0) {
        console.error('Login failed:', error);
        return false;
      }

      const adminUser = data[0];

      // Create session
      const sessionToken = crypto.randomUUID();
      const authUserId = crypto.randomUUID(); // This would be the actual auth user ID in production

      const { error: sessionError } = await supabase.rpc('create_admin_session', {
        p_admin_user_id: adminUser.admin_id,
        p_auth_user_id: authUserId,
        p_session_token: sessionToken,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
      });

      if (sessionError) {
        console.error('Session creation failed:', sessionError);
        return false;
      }

      // Store session token
      localStorage.setItem('admin_session_token', sessionToken);

      setUser({
        id: adminUser.admin_id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (token) {
        const { error } = await supabase.rpc('logout_admin_session', {
          p_session_token: token,
        });

        if (error) {
          console.error('Logout error:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_session_token');
      setUser(null);
    }
  };

  const value: AdminAuthContextType = {
    user,
    loading,
    login,
    logout,
    validateSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
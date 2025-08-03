import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  user: AdminUser | null;
  isLoading: boolean;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signOut: (sessionToken: string) => Promise<void>;
  sessionToken: string | null;
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
      // Simplified approach - just check if token exists and set a mock user
      if (token && token.length > 10) {
        setUser({
          id: "admin-1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          permissions: {
            organizations: true,
            analytics: true,
            settings: true
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simplified login - check basic credentials
      if (email && password) {
        const sessionToken = crypto.randomUUID();
        localStorage.setItem('admin_session_token', sessionToken);

        setUser({
          id: "admin-1",
          name: "Admin User",
          email: email,
          role: "admin",
          permissions: {
            organizations: true,
            analytics: true,
            settings: true
          }
        });

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('admin_session_token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.[permission] === true;
  };

  const signOut = async (sessionToken: string) => {
    await logout();
  };

  const sessionToken = localStorage.getItem('admin_session_token');

  const value: AdminAuthContextType = {
    adminUser: user,
    user,
    isLoading: loading,
    loading,
    hasPermission,
    signIn: login,
    login,
    logout,
    signOut,
    sessionToken,
    validateSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
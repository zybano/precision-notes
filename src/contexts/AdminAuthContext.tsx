import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {adminApiService} from '@/services/adminApiService';

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
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('admin_session_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored admin user:', error);
      }
    }

    if (token) {
      setSessionToken(token);
      validateSession(token).then((isValid) => {
        if (!isValid) {
          localStorage.removeItem('admin_session_token');
          localStorage.removeItem('admin_user');
          setSessionToken(null);
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const validateSession = async (token: string): Promise<boolean> => {
    try {
      const response = await adminApiService.listOrganizations(token);
      return response.success;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      if (email && password) {
        const response = await adminApiService.login(email, password);
        if (!response.success || !response.data?.sessionToken) {
          return false;
        }

        const resolvedUser: AdminUser = {
          id: response.data.adminId,
          name: response.data.fullName || response.data.username || email,
          email: response.data.email || email,
          role: 'platform_admin',
          permissions: {
            organizations: true,
            analytics: true,
            settings: true,
            billing: true,
            sandbox: true,
            platform_admins: true,
          }
        };

        localStorage.setItem('admin_session_token', response.data.sessionToken);
        localStorage.setItem('admin_user', JSON.stringify(resolvedUser));
        setSessionToken(response.data.sessionToken);
        setUser(resolvedUser);
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
      if (sessionToken) {
        await adminApiService.logout(sessionToken);
      }
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('admin_user');
      setSessionToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.[permission] === true;
  };

  const signOut = async (sessionToken: string) => {
    if (sessionToken) {
      setSessionToken(sessionToken);
    }
    await logout();
  };

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
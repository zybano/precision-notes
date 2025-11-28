import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  OrgSession,
  OrganizationUser,
  adminOnboard,
  loginWithPassword as apiLoginWithPassword,
  verifyOtp as apiVerifyOtp
} from "@/services/orgAuthApi";

interface AdminOnboardArgs {
  organizationId: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  department?: string;
}

interface OrgAuthContextValue {
  user: OrganizationUser | null;
  session: OrgSession | null;
  loading: boolean;
  onboardAdmin: (payload: AdminOnboardArgs) => Promise<{ organization: { id: string; name: string }; admin: OrganizationUser }>;
  loginWithPassword: (email: string, password: string) => Promise<OrganizationUser>;
  loginWithOtp: (email: string, otp: string) => Promise<OrganizationUser>;
  logout: () => void;
}

const OrgAuthContext = createContext<OrgAuthContextValue | undefined>(undefined);

const STORAGE_KEY = "org_auth_state";

export function OrgAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OrganizationUser | null>(null);
  const [session, setSession] = useState<OrgSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user ?? null);
        setSession(parsed.session ?? null);
      }
    } catch (error) {
      console.error("Failed to parse stored org auth state", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistAuth = (nextSession: OrgSession, nextUser: OrganizationUser) => {
    setSession(nextSession);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ session: nextSession, user: nextUser }));
  };

  const clearAuth = () => {
    setSession(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const onboardAdmin = async (payload: AdminOnboardArgs) => {
    const result = await adminOnboard(payload);
    persistAuth(result.session, result.admin);
    return { organization: result.organization, admin: result.admin };
  };

  const loginWithPassword = async (email: string, password: string) => {
    const result = await apiLoginWithPassword(email, password);
    persistAuth(result.session, result.user);
    return result.user;
  };

  const loginWithOtp = async (email: string, otp: string) => {
    const result = await apiVerifyOtp(email, otp);
    persistAuth(result.session, result.user);
    return result.user;
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      onboardAdmin,
      loginWithPassword,
      loginWithOtp,
      logout: clearAuth
    }),
    [user, session, loading]
  );

  return <OrgAuthContext.Provider value={value}>{children}</OrgAuthContext.Provider>;
}

export function useOrgAuth() {
  const context = useContext(OrgAuthContext);
  if (!context) {
    throw new Error("useOrgAuth must be used within OrgAuthProvider");
  }
  return context;
}

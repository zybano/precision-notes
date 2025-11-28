import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useOrgAuth } from "@/contexts/OrgAuthContext";

interface Props {
  children: ReactNode;
  redirectTo?: string;
}

export function OrgProtectedRoute({ children, redirectTo = "/admin/login" }: Props) {
  const { session, loading } = useOrgAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Checking access...
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

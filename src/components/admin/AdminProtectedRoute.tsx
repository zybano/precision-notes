import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {Loader2} from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AdminProtectedRoute({ 
  children, 
  requiredPermission 
}: AdminProtectedRouteProps) {
  const { adminUser, isLoading, hasPermission } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Preparing your admin workspace</p>
              <p className="text-xs text-muted-foreground">Validating session and permissions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    // Redirect to admin login with return URL
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    // User doesn't have required permission
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this section.
          </p>
          <p className="text-sm text-muted-foreground">
            Required permission: <code className="bg-muted px-2 py-1 rounded">{requiredPermission}</code>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

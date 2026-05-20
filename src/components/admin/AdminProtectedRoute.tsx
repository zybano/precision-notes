import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {AdminAuthProgressOverlay} from '@/components/admin/AdminAuthProgressOverlay';

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
      <AdminAuthProgressOverlay
        title="Loading admin console"
        description="Checking your current platform admin session."
      />
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

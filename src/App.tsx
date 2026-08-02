import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/AdminLogin';
import PlatformOverviewPage from './pages/admin/PlatformOverviewPage';
import OrganizationsPage from './pages/admin/OrganizationsPage';
import PlansBillingPage from './pages/admin/PlansBillingPage';
import ReportsPage from './pages/admin/ReportsPage';
import SandboxPage from './pages/admin/SandboxPage';
import PlatformAdminsPage from './pages/admin/PlatformAdminsPage';
import PlatformSettingsPage from './pages/admin/PlatformSettingsPage';
import {AdminAuthProvider} from '@/contexts/AdminAuthContext';
import {AdminProtectedRoute} from '@/components/admin/AdminProtectedRoute';
import PlatformAdminLayout from '@/components/admin/PlatformAdminLayout';
import {SidebarProvider} from '@/components/ui/sidebar';
import {Toaster} from 'sonner'; // Update to use Sonner directly
import {ToastProvider} from '@/providers/ToastProvider'; // Import from our new provider
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <ToastProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <PlatformAdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<PlatformOverviewPage />} />
                <Route
                  path="organizations"
                  element={
                    <AdminProtectedRoute requiredPermission="organizations">
                      <OrganizationsPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="plans-billing"
                  element={
                    <AdminProtectedRoute requiredPermission="billing">
                      <PlansBillingPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <AdminProtectedRoute requiredPermission="analytics">
                      <ReportsPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="sandbox"
                  element={
                    <AdminProtectedRoute requiredPermission="sandbox">
                      <SandboxPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="platform-admins"
                  element={
                    <AdminProtectedRoute requiredPermission="platform_admins">
                      <PlatformAdminsPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <AdminProtectedRoute requiredPermission="settings">
                      <PlatformSettingsPage />
                    </AdminProtectedRoute>
                  }
                />
              </Route>
              {import.meta.env.DEV && (
                <Route path="/__dev" element={<PlatformAdminLayout />}>
                  <Route path="plans-billing" element={<PlansBillingPage />} />
                </Route>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </SidebarProvider>
        </ToastProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

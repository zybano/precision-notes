import React from 'react';
import {Route, Routes, Navigate} from 'react-router-dom';
import AdminOnboardingPage from './pages/auth/AdminOnboardingPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import DashboardPage from './pages/DashboardPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import CreditUtilizationPage from './pages/CreditUtilizationPage';
import OrganizationalDocumentationPage from './pages/OrganizationalDocumentationPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import { OrgProtectedRoute } from './components/auth/OrgProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import {Toaster} from 'sonner';
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
      <Routes>
        {/* Public routes - Auth pages */}
        <Route path="/admin/onboard" element={<AdminOnboardingPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/reset-password" element={<PasswordResetPage />} />
        {/* Protected routes - All wrapped in AppLayout */}
        <Route
          path="/"
          element={
            <OrgProtectedRoute>
              <AppLayout>
                <Navigate to="/dashboard" replace />
              </AppLayout>
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <OrgProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/staff-management"
          element={
            <OrgProtectedRoute>
              <AppLayout>
                <StaffManagementPage />
              </AppLayout>
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/credit-utilization"
          element={
            <OrgProtectedRoute>
              <AppLayout>
                <CreditUtilizationPage />
              </AppLayout>
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/documentation"
          element={
            <OrgProtectedRoute>
              <AppLayout>
                <OrganizationalDocumentationPage />
              </AppLayout>
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <OrgProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </OrgProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <OrgProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </OrgProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard if authenticated, otherwise to login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;

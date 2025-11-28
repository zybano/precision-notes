import React from 'react';
import {Route, Routes} from 'react-router-dom';
import OrganizationalDocumentationPage from './pages/OrganizationalDocumentationPage';
import AdminOnboardingPage from './pages/auth/AdminOnboardingPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import { OrgProtectedRoute } from './components/auth/OrgProtectedRoute';
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
        <Route path="/" element={<OrganizationalDocumentationPage />} />
        <Route path="/b2b" element={<OrganizationalDocumentationPage />} />
        <Route path="/organizational-documentation" element={<OrganizationalDocumentationPage />} />
        <Route path="/admin/onboard" element={<AdminOnboardingPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/reset-password" element={<PasswordResetPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <OrgProtectedRoute>
              <StaffManagementPage />
            </OrgProtectedRoute>
          }
        />
        <Route path="*" element={<OrganizationalDocumentationPage />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;

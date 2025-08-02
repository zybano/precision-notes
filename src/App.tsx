
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DocumentationPage from './pages/DocumentationPage';
import Settings from './pages/Settings';
import PricingPage from './pages/PricingPage.tsx';
import Blog from './pages/Blog';
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCanceled from './pages/PaymentCanceled';
import ConsultationPurchase from "@/pages/ConsultationPurchase";
import Features from './pages/Features';
import Careers from './pages/Careers';
import Integrations from './pages/Integrations';
import OrganizationalDocumentationPage from './pages/OrganizationalDocumentationPage';
import NotFound from './pages/NotFound';
import Layout from '@/components/Layout';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminPage from './pages/admin/AdminPage.tsx';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from 'sonner'; // Update to use Sonner directly
import { ToastProvider } from '@/providers/ToastProvider'; // Import from our new provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      <AuthProvider>
        <AdminAuthProvider>
          <ToastProvider>
            <SidebarProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<OrganizationalDocumentationPage />} />
                <Route path="/individual" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/b2b" element={<OrganizationalDocumentationPage />} />
                
                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminPage />} />
                
                {/* Protected routes that need Layout with sidebar */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/documentation" element={<DocumentationPage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/consultation-purchase" element={<ConsultationPurchase />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/payment-canceled" element={<PaymentCanceled />} />
                    
                    {/* Hospital routes (nested under Layout) */}
                    <Route path="/hospital" element={<HospitalDashboard />} />
                    <Route path="/hospital/:section" element={<HospitalDashboard />} />
                  </Route>
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster position="top-right" richColors />
            </SidebarProvider>
          </ToastProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

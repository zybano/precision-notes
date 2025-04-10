
import { ToastProvider } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Import all page components
import Index from "@/pages/Index";
import Features from "@/pages/Features";
import Integrations from "@/pages/Integrations";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Security from "@/pages/Security";
import Blog from "@/pages/Blog";
import Careers from "@/pages/Careers";
import Pricing from "@/pages/Pricing";
import About from "@/pages/About";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Documentation from "@/pages/DocumentationPage";
import Settings from "@/pages/Settings";
import HospitalDashboard from "@/pages/hospital/HospitalDashboard";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HelmetProvider>
        <ToastProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SidebarProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:postId" element={<Blog />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Protected routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/documentation" element={<Documentation />} />
                      <Route path="/documentation/new" element={<Documentation />} />
                      <Route path="/settings" element={<Settings />} />
                      
                      {/* Hospital Management System routes */}
                      <Route path="/hospital" element={<HospitalDashboard />} />
                      <Route path="/hospital/emergency" element={<HospitalDashboard />} />
                      <Route path="/hospital/doctors" element={<HospitalDashboard />} />
                      <Route path="/hospital/nurses" element={<HospitalDashboard />} />
                      <Route path="/hospital/patients" element={<HospitalDashboard />} />
                      <Route path="/hospital/inpatient" element={<HospitalDashboard />} />
                      <Route path="/hospital/pharmacy" element={<HospitalDashboard />} />
                      <Route path="/hospital/laboratory" element={<HospitalDashboard />} />
                      <Route path="/hospital/inventory" element={<HospitalDashboard />} />
                      <Route path="/hospital/billing" element={<HospitalDashboard />} />
                    </Route>
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SidebarProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ToastProvider>
      </HelmetProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

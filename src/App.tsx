
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DocumentationPage from './pages/DocumentationPage';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
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
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/integrations" element={<Integrations />} />
        
        {/* Payment routes */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-canceled" element={<PaymentCanceled />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/consultation-purchase" element={<ConsultationPurchase />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

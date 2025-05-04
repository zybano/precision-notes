import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import DocumentationPage from './pages/DocumentationPage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/Pricing';
import BlogPage from './pages/BlogPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import NewDocument from '@/pages/NewDocument';
import EditDocument from '@/pages/EditDocument';
import HospitalDashboard from '@/pages/hospital/HospitalDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCanceled from './pages/PaymentCanceled';
import ConsultationPurchase from "@/pages/ConsultationPurchase";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Add new payment routes */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-canceled" element={<PaymentCanceled />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/documentation/new" element={<NewDocument />} />
          <Route path="/documentation/:id" element={<EditDocument />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/hospital" element={<HospitalDashboard />} />
          <Route path="/consultation-purchase" element={<ConsultationPurchase />} />
        </Route>
        
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

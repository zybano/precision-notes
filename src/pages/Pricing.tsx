
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {Link, useNavigate} from "react-router-dom";
import Logo from "@/components/Logo.tsx";
import {Footer} from "@/components/about/Footer.tsx";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Pricing | PrecisionNote";
  }, []);

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <SEO 
        title="Pricing"
        description="Choose the perfect plan for your healthcare practice. Simple, transparent pricing with flexible options for individual providers and large organizations."
        keywords="medical documentation pricing, healthcare software plans, clinical documentation costs"
      />
      {/* Navigation Bar */}
      <nav className="px-6 py-4 bg-background sticky top-0 z-10 border-b border-border w-full">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Logo/>
            <span className="ml-3 text-xl font-medium">PrecisionNote</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/about" className="text-secondary font-medium">About</Link>
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/dashboard">
              <Button variant="outline" className="hidden sm:inline-flex transition-all hover:shadow-sm">
                Log in
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button className="shadow-sm hover:shadow-md transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Simple, Transparent Pricing</h1>
        <div className="mt-4 text-xl px-8 py-6 bg-amber-100 text-amber-800 rounded-xl text-center mx-auto max-w-2xl">
          <p className="font-semibold mb-2">We are currently in Beta!</p>
          <p className="text-base">PrecisionNote is launching in Africa. Join us to be among the first to experience our revolutionary clinical documentation platform.</p>
        </div>
        
        <div className="mt-8">
          <Button 
            variant="outline" 
            className="shadow-sm hover:shadow-md transition-all"
            onClick={() => window.location.href = "mailto:hello@PrecisionNote.com?subject=PrecisionNote Sales Inquiry"}
          >
            Contact Sales
          </Button>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto grid gap-6">
          <div className="text-left">
            <h3 className="font-medium mb-2">Can I switch plans later?</h3>
            <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected on your next billing cycle.</p>
          </div>
          <div className="text-left">
            <h3 className="font-medium mb-2">What happens after my free trial ends?</h3>
            <p className="text-muted-foreground">After your 7-day free trial expires, you'll need to subscribe to one of our paid plans to continue using PrecisionNote.</p>
          </div>
          <div className="text-left">
            <h3 className="font-medium mb-2">How does billing work?</h3>
            <p className="text-muted-foreground">You'll be billed monthly or annually, depending on your preference. We accept all major credit cards and PayPal.</p>
          </div>
          <div className="text-left">
            <h3 className="font-medium mb-2">Which plan includes the Hospital Management System?</h3>
            <p className="text-muted-foreground">The Hospital Management System is exclusively available on our Enterprise plan. This comprehensive solution is designed for larger healthcare organizations.</p>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Pricing;

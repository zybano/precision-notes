
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { Mail } from "lucide-react";

const Pricing = () => {
  useEffect(() => {
    document.title = "Pricing | PrecisionNote";
  }, []);

  return (
    <LandingLayout 
      pageTitle="Pricing" 
      pageSubtitle="Simple, Transparent Pricing for All Your Needs"
      currentPage="pricing"
      heroBackground="from-secondary/20 to-secondary/40"
    >
      <SEO 
        title="Pricing"
        description="Choose the perfect plan for your healthcare practice. Simple, transparent pricing with flexible options for individual providers and large organizations."
        keywords="medical documentation pricing, healthcare software plans, clinical documentation costs"
      />

      <div className="container py-10 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="mt-4 text-xl px-8 py-6 bg-amber-100 text-amber-800 rounded-xl text-center mx-auto max-w-2xl">
            <p className="font-semibold mb-2">We are currently in Beta!</p>
            <p className="text-base">PrecisionNote is launching in Africa. Join us to be among the first to experience our revolutionary clinical documentation platform.</p>
          </div>
          
          <div className="mt-8">
            <Button 
              variant="outline" 
              className="shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              onClick={() => window.location.href = "mailto:hello@PrecisionNote.com?subject=PrecisionNote Sales Inquiry"}
            >
              <Mail className="h-4 w-4" />
              Contact Sales
            </Button>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto grid gap-6">
            <div className="text-left p-6 bg-white rounded-lg shadow-sm border border-border">
              <h3 className="font-medium mb-2 text-secondary">Can I switch plans later?</h3>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected on your next billing cycle.</p>
            </div>
            <div className="text-left p-6 bg-white rounded-lg shadow-sm border border-border">
              <h3 className="font-medium mb-2 text-secondary">What happens after my free trial ends?</h3>
              <p className="text-muted-foreground">After your 7-day free trial expires, you'll need to subscribe to one of our paid plans to continue using PrecisionNote.</p>
            </div>
            <div className="text-left p-6 bg-white rounded-lg shadow-sm border border-border">
              <h3 className="font-medium mb-2 text-secondary">How does billing work?</h3>
              <p className="text-muted-foreground">You'll be billed monthly or annually, depending on your preference. We accept all major credit cards and PayPal.</p>
            </div>
            <div className="text-left p-6 bg-white rounded-lg shadow-sm border border-border">
              <h3 className="font-medium mb-2 text-secondary">Which plan includes the Hospital Management System?</h3>
              <p className="text-muted-foreground">The Hospital Management System is exclusively available on our Enterprise plan. This comprehensive solution is designed for larger healthcare organizations.</p>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default Pricing;

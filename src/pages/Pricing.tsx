
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { Check, HelpCircle, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type BillingCycle = "monthly" | "annual";
type PlanTier = "free" | "basic" | "professional" | "enterprise";

interface PlanFeature {
  name: string;
  included: PlanTier[];
  tooltip?: string;
}

const Pricing = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [currentPlan, setCurrentPlan] = useState<PlanTier | null>(null);

  useEffect(() => {
    document.title = "Pricing | PrecisionNote";
    
    // In a real app, you would fetch the user's current plan from your database
    // For this example, we'll just assume it's "free" if they're logged in
    if (user) {
      // Example: fetch user subscription data
      // This would be replaced with an actual API call
      setCurrentPlan("free");
    }
  }, [user]);

  const features: PlanFeature[] = [
    { 
      name: "Monthly consultations", 
      included: ["free", "basic", "professional", "enterprise"],
      tooltip: "The number of consultations you can transcribe and analyze each month"
    },
    { 
      name: "SOAP Template", 
      included: ["free", "basic", "professional", "enterprise"] 
    },
    { 
      name: "History & Physical Template", 
      included: ["free", "basic", "professional", "enterprise"] 
    },
    { 
      name: "Progress Notes Template", 
      included: ["professional", "enterprise"] 
    },
    { 
      name: "Discharge Summary", 
      included: ["professional", "enterprise"] 
    },
    { 
      name: "Consultation Template", 
      included: ["professional", "enterprise"] 
    },
    { 
      name: "Procedure Notes", 
      included: ["professional", "enterprise"] 
    },
    { 
      name: "Specialty-specific templates", 
      included: ["professional", "enterprise"],
      tooltip: "Templates tailored for specific medical specialties"
    },
    { 
      name: "Custom templates", 
      included: ["professional", "enterprise"],
      tooltip: "Create and save your own note templates" 
    },
    { 
      name: "Email support", 
      included: ["basic", "professional", "enterprise"] 
    },
    { 
      name: "Priority support", 
      included: ["professional", "enterprise"],
      tooltip: "Get responses to your questions within 24 hours" 
    },
    { 
      name: "AI-powered dictation", 
      included: ["professional", "enterprise"] 
    },
    { 
      name: "Multi-team management", 
      included: ["enterprise"],
      tooltip: "Manage multiple teams and departments with custom permissions" 
    },
    { 
      name: "Dedicated account manager", 
      included: ["enterprise"] 
    },
    { 
      name: "Advanced analytics", 
      included: ["enterprise"],
      tooltip: "Detailed insights and reports on usage patterns and efficiency gains" 
    },
    { 
      name: "Hospital Management System", 
      included: ["enterprise"],
      tooltip: "Comprehensive hospital management features including patient tracking, inventory, and billing" 
    },
    { 
      name: "Custom integrations", 
      included: ["enterprise"],
      tooltip: "Connect with your existing EMR, EHR, or other healthcare systems" 
    },
  ];

  const plans = [
    {
      id: "free",
      name: "Free",
      description: "For individual providers starting out",
      consultations: 5,
      price: {
        monthly: 0,
        annual: 0
      },
      cta: "Start Free",
      ctaLink: "/signup",
      highlight: "No Credit Card Required"
    },
    {
      id: "basic",
      name: "Basic",
      description: "For growing practices",
      consultations: 30,
      price: {
        monthly: 25,
        annual: 285 // 5% discount on annual billing
      },
      cta: "Subscribe",
      ctaLink: "/signup?plan=basic",
      highlight: "Most Popular"
    },
    {
      id: "professional",
      name: "Professional",
      description: "For established medical practices",
      consultations: 80,
      price: {
        monthly: 85,
        annual: 969 // 5% discount on annual billing
      },
      cta: "Subscribe",
      ctaLink: "/signup?plan=professional",
      highlight: "Best Value"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For hospitals and large organizations",
      consultations: "Custom",
      price: {
        monthly: null,
        annual: null
      },
      cta: "Contact Sales",
      ctaLink: "mailto:sales@precisionnote.com?subject=Enterprise%20Plan%20Inquiry",
      highlight: "For Large Organizations"
    }
  ];

  // Top-up options
  const topupOptions = [
    { consultations: 7, price: 9 },
    { consultations: 18, price: 15 }
  ];

  return (
    <LandingLayout 
      pageTitle="Pricing" 
      pageSubtitle="Choose the perfect plan for your practice"
      currentPage="pricing"
      heroBackground="from-secondary/20 to-secondary/40"
    >
      <SEO 
        title="Pricing"
        description="Choose the perfect plan for your healthcare practice. Simple, transparent pricing with flexible options for individual providers and large organizations."
        keywords="medical documentation pricing, healthcare software plans, clinical documentation costs"
      />

      <div className="container py-10 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center p-1 bg-muted rounded-full mb-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly" 
                  ? "bg-white shadow-sm text-primary" 
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingCycle === "annual" 
                  ? "bg-white shadow-sm text-primary" 
                  : "text-muted-foreground"
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                Save 5%
              </span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-xl border ${
                  plan.highlight === "Most Popular" 
                    ? "border-primary shadow-lg" 
                    : "border-border"
                } bg-background p-6 relative flex flex-col h-full ${
                  currentPlan === plan.id ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
              >
                {currentPlan === plan.id && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                    Your Plan
                  </div>
                )}
                
                {plan.highlight && currentPlan !== plan.id && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                    plan.highlight === "Most Popular" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {plan.highlight}
                  </div>
                )}
                
                <div className="mb-5">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-5">
                  {plan.price.monthly !== null ? (
                    <div className="text-3xl font-bold mb-1">
                      ${billingCycle === "monthly" 
                        ? plan.price.monthly 
                        : plan.price.annual}
                      <span className="text-sm font-normal text-muted-foreground">
                        {billingCycle === "monthly" ? "/month" : "/year"}
                      </span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold mb-1">Custom</div>
                  )}
                  
                  {billingCycle === "annual" && plan.price.annual !== 0 && plan.price.annual !== null && (
                    <span className="text-sm text-green-600">Save 5% with annual billing</span>
                  )}
                </div>
                
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">
                      {typeof plan.consultations === 'number' 
                        ? `${plan.consultations} consultations/month` 
                        : "Custom consultations"}
                    </span>
                  </div>
                  
                  {features.filter(f => f.included.includes(plan.id as PlanTier)).slice(0, 3).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                  
                  {features.filter(f => f.included.includes(plan.id as PlanTier)).length > 3 && (
                    <div className="text-sm text-primary font-medium mt-1">
                      +{features.filter(f => f.included.includes(plan.id as PlanTier)).length - 3} more features
                    </div>
                  )}
                </div>
                
                <div className="mt-auto">
                  {currentPlan === plan.id ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Link to={plan.ctaLink} className="block">
                      <Button 
                        variant={plan.id === "enterprise" ? "outline" : "default"}
                        className={`w-full ${plan.highlight === "Most Popular" ? "bg-primary hover:bg-primary/90" : ""}`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-amber-800 bg-amber-100 p-6 rounded-xl max-w-2xl mx-auto">
            <h3 className="font-semibold text-lg mb-2">Currently in Beta</h3>
            <p>PrecisionNote is launching in Africa. Join us to be among the first to experience our revolutionary clinical documentation platform.</p>
          </div>
        </div>
        
        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-8 text-center">Compare Plans</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-6 text-left">Feature</th>
                  <th className="py-4 px-6 text-center">Free</th>
                  <th className="py-4 px-6 text-center">Basic</th>
                  <th className="py-4 px-6 text-center">Professional</th>
                  <th className="py-4 px-6 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">Monthly consultations</td>
                  <td className="py-4 px-6 text-center">5</td>
                  <td className="py-4 px-6 text-center">30</td>
                  <td className="py-4 px-6 text-center">80</td>
                  <td className="py-4 px-6 text-center">Custom</td>
                </tr>
                
                {features.slice(1).map((feature, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="py-3 px-6">
                      <div className="flex items-center">
                        <span>{feature.name}</span>
                        {feature.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>{feature.tooltip}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    
                    {(["free", "basic", "professional", "enterprise"] as PlanTier[]).map((tier) => (
                      <td key={tier} className="py-3 px-6 text-center">
                        {feature.included.includes(tier) ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Top-up options */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center">Need more consultations?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {topupOptions.map((option, index) => (
              <Card key={index} className="border-border hover:border-primary hover:shadow-sm transition-all">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold mb-2">${option.price}</div>
                  <p className="text-muted-foreground mb-4">Add {option.consultations} more consultations</p>
                  <Button variant="outline" className="w-full">
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
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
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Have questions about our plans?</p>
          <Button 
            variant="outline" 
            className="shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            onClick={() => window.location.href = "mailto:sales@PrecisionNote.com?subject=PrecisionNote Pricing Inquiry"}
          >
            <Mail className="h-4 w-4" />
            Contact Sales
          </Button>
        </div>
      </div>
    </LandingLayout>
  );
};

export default Pricing;

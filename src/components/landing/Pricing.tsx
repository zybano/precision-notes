
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

type BillingCycle = "monthly" | "annual";

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  
  const pricingPlans = [
    {
      name: "Free",
      description: "For individual providers starting out",
      price: {
        monthly: "$0",
        annual: "$0"
      },
      ctaLabel: "Start Free",
      ctaLink: "/signup",
      features: [
        "5 consultations",
        "SOAP Template",
        "History & Physical Template",
        "Secure storage"
      ],
      highlight: "No Credit Card Required",
      popular: false
    },
    {
      name: "Basic",
      description: "For growing practices",
      price: {
        monthly: "$25",
        annual: "$285"
      },
      ctaLabel: "Subscribe",
      ctaLink: "/signup?plan=basic",
      features: [
        "30 consultations/month",
        "SOAP Template",
        "History & Physical Template",
        "Email Support",
        "Secure storage"
      ],
      highlight: "Most Popular",
      popular: true,
      savings: "Save 5% annually"
    },
    {
      name: "Professional",
      description: "For established medical practices",
      price: {
        monthly: "$85",
        annual: "$969"
      },
      ctaLabel: "Subscribe",
      ctaLink: "/signup?plan=professional",
      features: [
        "80 consultations/month",
        "All Templates",
        "Priority Support",
        "Dictation",
        "Custom templates",
        "Advanced analytics"
      ],
      highlight: "Best Value",
      popular: false,
      savings: "Save 5% annually"
    },
    {
      name: "Enterprise",
      description: "For hospitals and large organizations",
      price: {
        monthly: "Custom",
        annual: "Custom"
      },
      ctaLabel: "Contact Sales",
      ctaLink: "mailto:sales@precisionnote.com?subject=Enterprise%20Plan%20Inquiry",
      features: [
        "Everything in Professional",
        "Custom integrations",
        "Multi-team management",
        "Dedicated account manager",
        "Advanced Analytics",
        "Hospital Management System"
      ],
      highlight: "For Large Organizations",
      popular: false,
      contactSales: true
    }
  ];

  // Top-up options
  const topupOptions = [
    { consultations: 7, price: "$9" },
    { consultations: 18, price: "$15" }
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white border-t border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your practice. All plans include core features with flexible options as you grow.
            </p>
            
            <div className="mt-6 inline-flex items-center p-1 bg-muted rounded-full">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`rounded-xl border ${
                  plan.popular 
                    ? "border-primary shadow-lg" 
                    : "border-border"
                } bg-background p-6 relative flex flex-col h-full`}
              >
                {plan.highlight && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                    plan.popular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {plan.highlight}
                  </div>
                )}
                
                <div className="mb-5">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-5">
                  <div className="text-3xl font-bold mb-1">
                    {plan.price[billingCycle]}
                    {plan.price[billingCycle] !== "Custom" && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {billingCycle === "monthly" ? "/month" : "/year"}
                      </span>
                    )}
                  </div>
                  {billingCycle === "annual" && plan.savings && (
                    <span className="text-sm text-green-600">{plan.savings}</span>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to={plan.ctaLink} className="mt-auto block">
                  <Button 
                    variant={plan.contactSales ? "outline" : "default"}
                    className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                  >
                    {plan.ctaLabel}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          
          {/* Top-up options */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-6">Need more consultations?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topupOptions.map((option, index) => (
                <div key={index} className="border border-border rounded-lg p-5 text-center bg-background hover:border-primary hover:shadow-sm transition-all">
                  <div className="text-2xl font-bold mb-2">{option.price}</div>
                  <p className="text-muted-foreground mb-4">Add {option.consultations} more consultations</p>
                  <Button variant="outline" className="w-full">
                    Purchase
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
        
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">Have questions about our plans?</p>
          <Button 
            variant="outline" 
            className="shadow-sm hover:shadow-md transition-all"
            onClick={() => window.location.href = "mailto:sales@PrecisionNote.com?subject=PrecisionNote Pricing Inquiry"}
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
}

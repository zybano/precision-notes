// PricingPlan.tsx
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { SubscriptionTier } from "@/services/subscriptionService";

interface PricingPlanProps {
  plan: {
    id: string;
    tier: SubscriptionTier;
    name: string;
    description: string;
    price: {
      monthly: string;
      annual: string;
    };
    features: string[];
    ctaLabel: string;
    ctaLink: string;
    highlight?: string;
    popular?: boolean;
    savings?: string;
    contactSales?: boolean;
  };
  billingCycle: "monthly" | "annual";
  user: any | null;
  onSelectPlan: (plan: any) => void;
}

export const PricingPlan = ({ plan, billingCycle, user, onSelectPlan }: PricingPlanProps) => {
  return (
    <div 
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
      
      <div className="mt-auto">
        {user ? (
          <Button 
            variant={plan.contactSales ? "outline" : "default"}
            className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
            onClick={() => onSelectPlan(plan)}
          >
            {plan.ctaLabel}
          </Button>
        ) : (
          <Link to={plan.ctaLink} className="block">
            <Button 
              variant={plan.contactSales ? "outline" : "default"}
              className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
            >
              {plan.ctaLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
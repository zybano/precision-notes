import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Pricing | Documedly";
  }, []);
  
  // In a real app, this would come from a database or user metadata
  const userSubscriptionLevel = user?.user_metadata?.subscription_level || 'free';

  const handleSubscribe = (plan: string) => {
    if (!user) {
      toast.error("Please log in to subscribe");
      navigate("/login");
      return;
    }
    
    // Mock subscription handling
    if (plan === 'enterprise') {
      // In a real app, this would redirect to a payment page and update the user's subscription in the database
      toast.success("Enterprise access granted for demo purposes");
      
      // For demo, we'll just modify the user_metadata in localStorage to simulate subscription
      const fakeUserUpdate = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          subscription_level: 'enterprise'
        }
      };
      
      // Store the updated user in localStorage
      localStorage.setItem('sb-user', JSON.stringify(fakeUserUpdate));
      
      // Force a page refresh to update the auth context with new metadata
      window.location.reload();
    } else if (plan === 'basic' || plan === 'professional') {
      toast.info("This plan doesn't include Hospital System access");
    } else {
      toast.info("Starting free trial");
    }
  };

  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      description: "7-day trial of essential features",
      features: [
        "3 Patient Records",
        "1 Template",
        "Basic Transcription",
        "Community Support"
      ],
      timeLimit: "Valid for 7 days",
      highlighted: false,
      buttonText: "Start Free Trial"
    },
    {
      name: "Basic",
      price: "$9",
      description: "Essential features for individuals",
      features: [
        "5 Patient Records",
        "3 Templates",
        "Basic Transcription",
        "Email Support"
      ],
      highlighted: false,
      buttonText: "Get Started"
    },
    {
      name: "Professional",
      price: "$29",
      description: "Comprehensive tools for growing teams",
      features: [
        "Unlimited Patient Records",
        "All Templates",
        "Advanced Transcription with Diarization",
        "Priority Support",
        "Calendar Integration",
        "Analytics Dashboard"
      ],
      highlighted: true,
      buttonText: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "$99",
      description: "Custom solutions for large healthcare organizations",
      features: [
        "Everything in Professional",
        "Custom Templates",
        "Advanced Analytics",
        "API Access",
        "Dedicated Account Manager",
        "HIPAA Compliance Assistance",
        "Hospital Management System Access"
      ],
      highlighted: false,
      buttonText: userSubscriptionLevel === 'enterprise' ? "Current Plan" : "Contact Sales",
      isEnterprise: true
    }
  ];

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <SEO 
        title="Pricing"
        description="Choose the perfect plan for your healthcare practice. Simple, transparent pricing with flexible options for individual providers and large organizations."
        keywords="medical documentation pricing, healthcare software plans, clinical documentation costs"
      />
      
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your practice. All plans include core features with flexible options as you grow.
        </p>
        <div className="mt-4 inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
          Currently in Beta as we launch in Africa. Join to use Documedly!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col h-full ${plan.highlighted ? 'border-primary shadow-lg' : ''} ${plan.isEnterprise ? 'border-purple-400 shadow-md' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                {plan.name}
                {plan.isEnterprise && <Lock className="h-4 w-4 text-purple-500" />}
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
              {plan.timeLimit && (
                <span className="inline-block mt-2 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  {plan.timeLimit}
                </span>
              )}
              {plan.isEnterprise && userSubscriptionLevel === 'enterprise' && (
                <span className="inline-block mt-2 text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  Your current plan
                </span>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check size={18} className={`mr-2 ${plan.isEnterprise ? 'text-purple-500' : 'text-primary'} shrink-0 mt-0.5`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full ${plan.highlighted ? 'bg-primary' : ''} ${plan.isEnterprise ? 'bg-purple-600 hover:bg-purple-700' : ''}`} 
                variant={plan.highlighted ? "default" : plan.isEnterprise ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.isEnterprise ? 'enterprise' : plan.name.toLowerCase())}
                disabled={plan.isEnterprise && userSubscriptionLevel === 'enterprise'}
              >
                {userSubscriptionLevel === 'enterprise' && plan.isEnterprise ? "Current Plan" : plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
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
    </div>
  );
};

export default Pricing;

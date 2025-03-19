
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const Pricing = () => {
  useEffect(() => {
    document.title = "Pricing | NoteMedAI";
  }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Get started with essential features",
      features: [
        "3 Patient Records",
        "1 Template",
        "Basic Transcription",
        "Community Support"
      ],
      highlighted: false,
      buttonText: "Get Started"
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
        "HIPAA Compliance Assistance"
      ],
      highlighted: false,
      buttonText: "Contact Sales"
    }
  ];

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your practice. All plans include core features with flexible options as you grow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col h-full ${plan.highlighted ? 'border-primary shadow-lg' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check size={18} className="mr-2 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full ${plan.highlighted ? 'bg-primary' : ''}`} 
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.buttonText}
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
            <h3 className="font-medium mb-2">Is there a free trial available?</h3>
            <p className="text-muted-foreground">We offer a 14-day free trial for our Professional plan, no credit card required.</p>
          </div>
          <div className="text-left">
            <h3 className="font-medium mb-2">How does billing work?</h3>
            <p className="text-muted-foreground">You'll be billed monthly or annually, depending on your preference. We accept all major credit cards and PayPal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

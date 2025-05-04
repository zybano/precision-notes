
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";
import { ConsultationTopup } from "@/components/subscription/ConsultationTopup";
import { useAuth } from "@/contexts/AuthContext";

const ConsultationPurchase = () => {
  const { subscriptionInfo } = useAuth();
  
  return (
    <div className="container max-w-5xl py-12 px-4">
      <SEO 
        title="Purchase Consultations" 
        description="Add more consultations to your PrecisionNote account"
      />
      
      <FadeIn>
        <Button variant="outline" asChild className="mb-8">
          <Link to="/pricing">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pricing
          </Link>
        </Button>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Add More Consultations</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Need more consultations? Purchase additional consultations without changing your subscription plan.
          </p>
          
          {subscriptionInfo && (
            <div className="mt-4 text-sm inline-block bg-muted px-4 py-2 rounded-full">
              Your current plan: <span className="font-medium">{subscriptionInfo.tier}</span> 
              {subscriptionInfo.consultationsRemaining > 0 && (
                <> • <span className="font-medium">{subscriptionInfo.consultationsRemaining}</span> consultations remaining</>
              )}
            </div>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto">
          <ConsultationTopup />
          
          <div className="mt-12 p-4 bg-muted rounded-lg text-center">
            <h3 className="font-medium mb-2">Need a custom package?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              For bulk purchases or custom consultation packages, contact our sales team.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "mailto:sales@precisionnote.com?subject=Custom%20Consultation%20Package"}>
              Contact Sales
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default ConsultationPurchase;

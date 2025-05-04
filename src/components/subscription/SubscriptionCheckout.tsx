
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateSubscriptionTier, SubscriptionTier } from "@/services/subscriptionService";
import { toast } from "sonner";

interface SubscriptionCheckoutProps {
  tier: SubscriptionTier;
  price: string;
  isAnnual: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SubscriptionCheckout = ({ 
  tier, 
  price, 
  isAnnual,
  onSuccess,
  onCancel
}: SubscriptionCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      // For demonstration, we'll just update the tier directly
      // In a real implementation, this would go through a Stripe checkout process
      const success = await updateSubscriptionTier(tier);
      
      if (success) {
        toast.success(`Successfully subscribed to ${tier} plan!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error("Failed to update subscription");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate what you save with annual billing (if annual)
  const calculateSavings = () => {
    if (!isAnnual) return null;
    
    // Extract numeric part from price string (assumes format like "$25")
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    
    // Annual plan saves 5% compared to paying monthly
    const monthlyCost = numericPrice;
    const annualCost = monthlyCost * 12 * 0.95;
    const savings = monthlyCost * 12 - annualCost;
    
    return savings.toFixed(2);
  };
  
  const savings = calculateSavings();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Subscription</CardTitle>
        <CardDescription>
          You are subscribing to the {tier.charAt(0).toUpperCase() + tier.slice(1)} plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {price}
            <span className="text-sm font-normal text-muted-foreground">
              {isAnnual ? '/year' : '/month'}
            </span>
          </div>
          
          {savings && (
            <div className="text-sm text-green-600">
              You save ${savings} with annual billing
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            {isAnnual 
              ? "You will be billed annually" 
              : "You will be billed monthly"}
          </div>
        </div>
        
        <div className="border-t border-border pt-4 mt-4">
          <Button 
            className="w-full"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : `Subscribe to ${tier} Plan`}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full mt-2"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

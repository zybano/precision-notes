
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createPlanCheckout } from "@/services/payment/paymentService";
import { SubscriptionTier } from "@/services/subscriptionService";
import { getRegionInfo } from "@/services/regionalPricingService";

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
  const [regionInfo, setRegionInfo] = useState<{
    countryCode: string;
    region: string;
    currency: string;
    currencySymbol: string;
    isNigeria: boolean;
  } | null>(null);

  // Get region info on component mount
  useEffect(() => {
    const fetchRegionInfo = async () => {
      try {
        const info = await getRegionInfo();
        setRegionInfo(info);
      } catch (error) {
        console.error("Error fetching region info:", error);
      }
    };

    fetchRegionInfo();
  }, []);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      // Use the unified payment service
      const result = await createPlanCheckout({
        tier,
        isAnnual,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/payment-canceled`,
      });

      if (result.success && result.url) {
        // Redirect to checkout page
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to create checkout session");
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

    // Extract numeric part from price string (assumes format like "$25" or "₦5000")
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));

    if (isNaN(numericPrice)) return null;

    // Annual plan saves 20% compared to paying monthly
    const monthlyCost = numericPrice;
    const annualCost = monthlyCost * 12 * 0.80;
    const savings = monthlyCost * 12 - annualCost;

    const currencySymbol = regionInfo?.currencySymbol || '$';
    return `${currencySymbol}${savings.toFixed(2)}`;
  };

  const savings = calculateSavings();
  const formattedTier = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
      <Card>
        <CardHeader>
          <CardTitle>Confirm Subscription</CardTitle>
          <CardDescription>
            You are subscribing to the {formattedTier} plan {regionInfo?.isNigeria ? 'with Nigeria pricing' : ''}
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
                  You save {savings} with annual billing
                </div>
            )}

            <div className="text-sm text-muted-foreground">
              {isAnnual
                  ? "You will be billed annually"
                  : "You will be billed monthly"}
            </div>

            {regionInfo?.isNigeria && (
                <div className="text-sm mt-2 p-2 bg-green-50 text-green-800 rounded-md">
                  🇳🇬 Regional Discount pricing applied
                </div>
            )}
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Subscribe to ${formattedTier} Plan`}
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

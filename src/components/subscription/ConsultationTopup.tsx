
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createConsultationCheckout } from "@/services/payment/stripeService";

interface ConsultationTopupProps {
  onCheckout?: () => void;
  defaultQuantity?: number;
}

export const ConsultationTopup = ({ onCheckout, defaultQuantity = 10 }: ConsultationTopupProps) => {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setQuantity(value);
    }
  };
  
  const initiateCheckout = async () => {
    try {
      setIsLoading(true);
      
      // Get the current URL to use as base for success/cancel URLs
      const baseUrl = window.location.origin;
      
      const result = await createConsultationCheckout(
        quantity,
        `${baseUrl}/payment-success`,
        `${baseUrl}/payment-canceled`
      );
      
      if (result.success && result.url) {
        // Call the onCheckout callback if provided
        if (onCheckout) {
          onCheckout();
        }
        
        // Redirect to Stripe checkout page
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
  
  const getEstimatedPrice = () => {
    const unitPrice = quantity >= 50 ? 3 : 4;
    return (quantity * unitPrice).toFixed(2);
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Number of consultations</Label>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => quantity > 1 && setQuantity(quantity - 1)}
          >
            -
          </Button>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </Button>
        </div>
      </div>
      
      <div className="rounded-md bg-muted p-3">
        <div className="flex justify-between text-sm">
          <span>Unit price:</span>
          <span>${quantity >= 50 ? '3.00' : '4.00'}/consultation</span>
        </div>
        <div className="flex justify-between font-medium mt-2">
          <span>Total:</span>
          <span>${getEstimatedPrice()}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {quantity >= 50 ? 'Discount applied for 50+ consultations' : 'Buy 50+ consultations for a discount'}
        </div>
      </div>
      
      <Button 
        className="w-full"
        onClick={initiateCheckout}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Proceed to Checkout'}
      </Button>
    </div>
  );
};

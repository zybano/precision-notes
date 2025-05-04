
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createConsultationTopupCheckout } from "@/services/payment/stripeService";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface TopupOption {
  consultations: number;
  price: number;
}

export const ConsultationTopup = () => {
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const { user } = useAuth();
  
  const topupOptions: TopupOption[] = [
    { consultations: 7, price: 9 },
    { consultations: 18, price: 15 }
  ];

  const handlePurchase = async (option: TopupOption) => {
    if (!user) {
      toast.error("You must be logged in to purchase consultations");
      return;
    }

    setIsProcessing(option.consultations);
    
    try {
      const checkoutUrl = await createConsultationTopupCheckout(
        option.consultations,
        option.price
      );
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error("Failed to create checkout session");
        setIsProcessing(null);
      }
    } catch (error) {
      console.error("Error purchasing consultations:", error);
      toast.error("An error occurred while setting up payment");
      setIsProcessing(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {topupOptions.map((option) => (
        <Card key={option.consultations} className="border border-border hover:border-primary hover:shadow-sm transition-all">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">${option.price}</CardTitle>
            <CardDescription>Get {option.consultations} more consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Immediate access</li>
              <li>• Same features as your current plan</li>
              <li>• No recurring charges</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handlePurchase(option)} 
              disabled={isProcessing !== null}
              className="w-full"
            >
              {isProcessing === option.consultations ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                "Purchase"
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

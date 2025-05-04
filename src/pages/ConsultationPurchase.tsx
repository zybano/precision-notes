
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { createConsultationCheckout } from "@/services/payment/stripeService";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

const PREDEFINED_AMOUNTS = [10, 25, 50, 100, 200];
const MIN_CONSULTATIONS = 5;
const MAX_CONSULTATIONS = 500;

const ConsultationPurchase = () => {
  const [quantity, setQuantity] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleQuantitySliderChange = (value: number[]) => {
    setQuantity(value[0]);
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= MIN_CONSULTATIONS && value <= MAX_CONSULTATIONS) {
      setQuantity(value);
    }
  };
  
  const getUnitPriceInDollars = () => {
    return quantity >= 50 ? 3 : 4;
  };
  
  const getTotalPriceInDollars = () => {
    return getUnitPriceInDollars() * quantity;
  };
  
  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please log in to purchase consultations");
      navigate("/login");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { success, url, error } = await createConsultationCheckout(
        quantity,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/payment-canceled`
      );
      
      if (success && url) {
        window.location.href = url;
      } else {
        toast.error(error || "Failed to create checkout session");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Purchase Consultations</h1>
            <p className="text-muted-foreground mt-2">
              Buy additional consultations to expand your PrecisionNote usage
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Quantity</CardTitle>
              <CardDescription>
                Choose how many consultations you would like to purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="consultations">Consultations</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="consultations"
                        type="number"
                        min={MIN_CONSULTATIONS}
                        max={MAX_CONSULTATIONS}
                        value={quantity}
                        onChange={handleQuantityInputChange}
                        className="w-20 text-right"
                      />
                      <span>credits</span>
                    </div>
                  </div>
                  
                  <Slider
                    value={[quantity]}
                    min={MIN_CONSULTATIONS}
                    max={MAX_CONSULTATIONS}
                    step={1}
                    onValueChange={handleQuantitySliderChange}
                  />
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      Min: {MIN_CONSULTATIONS}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Max: {MAX_CONSULTATIONS}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {PREDEFINED_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant={quantity === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuantity(amount)}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Price per consultation:</span>
                  <span className="font-medium">${getUnitPriceInDollars().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">${getTotalPriceInDollars().toFixed(2)}</span>
                </div>
                
                {quantity >= 50 && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md text-sm">
                    <span className="font-medium text-green-700 dark:text-green-400">
                      Bulk discount applied! ${(4 - getUnitPriceInDollars()).toFixed(2)} savings per consultation.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                onClick={handleCheckout} 
                disabled={isLoading} 
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You will be redirected to our secure payment processor to complete your purchase.
                Your consultations will be added to your account immediately after payment.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultationPurchase;

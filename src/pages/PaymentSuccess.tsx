
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2 } from "lucide-react";
import { verifyTopupPurchase } from "@/services/payment/stripeService";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { refreshSubscriptionInfo } = useAuth();
  const [verifyingPurchase, setVerifyingPurchase] = useState(true);
  const [verified, setVerified] = useState(false);
  
  useEffect(() => {
    const verifyPurchase = async () => {
      if (!sessionId) {
        setVerifyingPurchase(false);
        toast.error("No session ID found");
        return;
      }
      
      try {
        setVerifyingPurchase(true);
        const success = await verifyTopupPurchase(sessionId);
        
        if (success) {
          setVerified(true);
          toast.success("Payment successful! Your consultations have been added.");
          // Refresh subscription info to update the UI
          await refreshSubscriptionInfo();
        } else {
          toast.error("Could not verify your purchase. Please contact support.");
        }
      } catch (error) {
        console.error("Error verifying purchase:", error);
        toast.error("An error occurred while verifying your purchase");
      } finally {
        setVerifyingPurchase(false);
      }
    };
    
    verifyPurchase();
  }, [sessionId, refreshSubscriptionInfo]);
  
  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight">Thank you for your purchase!</h1>
        
        {verifyingPurchase ? (
          <p className="text-muted-foreground">Verifying your payment...</p>
        ) : verified ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your consultation credits have been added to your account. You can now use them for
              accessing premium features.
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/documentation')}
                className="w-full"
              >
                Create New Document
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              We couldn't verify your payment. If you believe this is an error,
              please contact our support team.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;

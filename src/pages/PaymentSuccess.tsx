
import { useEffect, useState } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { verifyTopupPurchase } from "@/services/payment/stripeService";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

const PaymentSuccess = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const location = useLocation();
  const { refreshSubscriptionInfo } = useAuth();
  
  useEffect(() => {
    const verifyPayment = async () => {
      // Extract session_id from the URL
      const queryParams = new URLSearchParams(location.search);
      const sessionId = queryParams.get("session_id");
      
      if (sessionId) {
        try {
          const success = await verifyTopupPurchase(sessionId);
          setIsSuccess(success);
          
          // Refresh subscription info to update UI
          if (success) {
            await refreshSubscriptionInfo();
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          setIsSuccess(false);
        } finally {
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
        setIsSuccess(false);
      }
    };
    
    verifyPayment();
  }, [location.search, refreshSubscriptionInfo]);
  
  const SuccessContent = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your consultations have been added to your account.
            You can now continue using PrecisionNote with your updated consultation balance.
          </p>
        </div>
        
        <div className="pt-4 space-y-4">
          <Button asChild className="w-full">
            <Link to="/dashboard">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/documentation/new">Create New Document</Link>
          </Button>
        </div>
      </div>
    </div>
  );

  const LoadingContent = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h1 className="text-2xl font-bold">Verifying your payment...</h1>
        <p className="text-muted-foreground">Please wait while we confirm your purchase.</p>
      </div>
    </div>
  );
  
  // If verification failed, redirect to dashboard
  if (!isSuccess && !isVerifying) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <Layout>
      {isVerifying ? <LoadingContent /> : <SuccessContent />}
    </Layout>
  );
};

export default PaymentSuccess;

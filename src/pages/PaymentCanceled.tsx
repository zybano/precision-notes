
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

const PaymentCanceled = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center space-y-6">
        <XCircle className="h-16 w-16 text-amber-500 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Payment Canceled</h1>
          <p className="text-muted-foreground">
            Your payment process was canceled and you have not been charged.
            You can try again whenever you're ready.
          </p>
        </div>
        
        <div className="pt-4">
          <Button asChild className="w-full">
            <Link to="/pricing">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pricing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;

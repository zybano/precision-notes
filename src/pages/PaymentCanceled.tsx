
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

const PaymentCanceled = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight">Payment Canceled</h1>
        
        <p className="text-muted-foreground">
          Your payment was canceled and you have not been charged.
          You can try again whenever you're ready.
        </p>
        
        <div className="space-y-2">
          <Button 
            onClick={() => navigate('/consultation-purchase')}
            className="w-full"
          >
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;

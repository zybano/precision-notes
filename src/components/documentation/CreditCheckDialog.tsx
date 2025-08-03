import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Coins, CreditCard} from "lucide-react";

interface CreditCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  requiredCredits: number;
}

const CreditCheckDialog: React.FC<CreditCheckDialogProps> = ({
  open,
  onOpenChange,
  currentBalance,
  requiredCredits,
}) => {


  const handlePurchaseClick = () => {
    onOpenChange(false);
    // Navigate to the credits purchase page
   // window.location.href = '/consultation-purchase'}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Coins className="mr-2 h-5 w-5 text-amber-500" />
            Insufficient Credits
          </DialogTitle>
          <DialogDescription>
            You don't have enough credits to perform this action.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Current Balance:</span>
              <span className="font-semibold">{currentBalance} credits</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Required:</span>
              <span className="font-semibold">{requiredCredits} credits</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm font-medium">Remaining After:</span>
              <span className={`font-semibold ${currentBalance - requiredCredits < 0 ? 'text-red-500' : ''}`}>
                {currentBalance - requiredCredits} credits
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => window.location.href = '/consultation-purchase'} className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Purchase Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditCheckDialog;
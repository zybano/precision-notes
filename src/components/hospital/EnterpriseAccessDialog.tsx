
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EnterpriseAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnterpriseAccessDialog = ({ open, onOpenChange }: EnterpriseAccessDialogProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Enterprise Feature
          </DialogTitle>
          <DialogDescription>
            The Hospital Management System is only available for Enterprise subscribers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Building2 className="h-10 w-10 text-primary" />
            <div>
              <h4 className="font-medium">Hospital Management System</h4>
              <p className="text-sm text-muted-foreground">
                Manage all aspects of your healthcare organization with our comprehensive suite of tools.
              </p>
            </div>
          </div>
          <p className="text-sm">
            Upgrade to our Enterprise plan to unlock this premium feature and all other advanced capabilities.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade}>
            Upgrade to Enterprise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnterpriseAccessDialog;

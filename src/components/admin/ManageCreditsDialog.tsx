import React, {useState} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {CreditCard, Loader2, Minus, Plus} from "lucide-react";
import {toast} from "sonner";

interface Organization {
  id: string;
  name: string;
  contact_email: string;
  contact_name: string;
  industry: string;
  credits_remaining: number;
  rate_limit_per_hour: number;
  api_key: string;
  allowed_document_types: string[];
  created_at: string;
  last_activity: string;
  total_requests: number;
  is_active: boolean;
}

interface ManageCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  onManageCredits: (organizationId: string, creditAdjustment: number, description: string) => Promise<void>;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export function ManageCreditsDialog({
  open,
  onOpenChange,
  organization,
  onManageCredits
}: ManageCreditsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState(0);
  const [description, setDescription] = useState('');

  const handleQuickAmount = (amount: number, isAdd: boolean) => {
    setCreditAdjustment(isAdd ? amount : -amount);
    setDescription(isAdd ? `Added ${amount} credits` : `Removed ${amount} credits`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creditAdjustment === 0) {
      toast.error('Please enter a credit adjustment amount');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a description for this adjustment');
      return;
    }

    const newTotal = organization.credits_remaining + creditAdjustment;
    if (newTotal < 0) {
      toast.error('Cannot reduce credits below zero');
      return;
    }

    setIsLoading(true);
    try {
      await onManageCredits(organization.id, creditAdjustment, description.trim());
      // Reset form
      setCreditAdjustment(0);
      setDescription('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const newBalance = organization.credits_remaining + creditAdjustment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Credits</DialogTitle>
          <DialogDescription>
            Adjust credit balance for {organization.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance:</span>
                <Badge variant="outline" className="font-mono">
                  {organization.credits_remaining.toLocaleString()} credits
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Requests:</span>
                <span className="font-mono text-sm">
                  {organization.total_requests.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Label>Quick Add Credits</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount, true)}
                  className="text-green-600 hover:bg-green-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {amount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Quick Remove Credits</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.filter(amount => amount <= organization.credits_remaining).map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount, false)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Minus className="h-3 w-3 mr-1" />
                  {amount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Adjustment */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit_adjustment">Manual Adjustment</Label>
              <Input
                id="credit_adjustment"
                type="number"
                value={creditAdjustment || ''}
                onChange={(e) => setCreditAdjustment(parseInt(e.target.value) || 0)}
                placeholder="Enter amount (positive to add, negative to remove)"
              />
              <p className="text-xs text-muted-foreground">
                Use positive numbers to add credits, negative to remove
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for credit adjustment..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Preview */}
          {creditAdjustment !== 0 && (
            <Card className={`border-2 ${creditAdjustment > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">New Balance:</span>
                  <Badge variant={newBalance >= 0 ? "default" : "destructive"} className="font-mono">
                    {newBalance.toLocaleString()} credits
                  </Badge>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Change:</span>
                  <span className={`text-sm font-medium ${creditAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {creditAdjustment > 0 ? '+' : ''}{creditAdjustment.toLocaleString()} credits
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || creditAdjustment === 0 || newBalance < 0}
              className={creditAdjustment > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {creditAdjustment > 0 ? 'Add Credits' : 'Remove Credits'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

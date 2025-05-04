
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {CalendarIcon, CreditCard, InfoIcon, PlusCircle, RefreshCw} from "lucide-react";
import { getSubscriptionTierName } from "@/services/subscriptionService";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { SubscriptionCheckout } from "@/components/subscription/SubscriptionCheckout";

export const SubscriptionUsage = () => {
  const { subscriptionInfo, refreshSubscriptionInfo } = useAuth();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  
  if (!subscriptionInfo) {
    return null;
  }
  
  const { tier, consultationsRemaining, consultationsTotal, nextBillingDate, isAnnualBilling } = subscriptionInfo;
  const usedConsultations = consultationsTotal - consultationsRemaining;
  const usagePercentage = Math.floor((usedConsultations / consultationsTotal) * 100);
  
  // Determine if upgrade is available based on tier
  const canUpgrade = tier !== 'enterprise';
  
  // Determine next tier for upgrade
  const getNextTier = () => {
    switch (tier) {
      case 'free': return 'starter';
      case 'starter': return 'professional';
      case 'professional': return 'enterprise';
      default: return null;
    }
  };
  
  const nextTier = getNextTier();
  
  // Get next tier price
  const getNextTierPrice = () => {
    switch (nextTier) {
      case 'starter': return isAnnualBilling ? "$285" : "$25";
      case 'professional': return isAnnualBilling ? "$969" : "$85";
      case 'enterprise': return "Custom";
      default: return "";
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Your Subscription</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refreshSubscriptionInfo()}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {getSubscriptionTierName(tier)} Plan
          {isAnnualBilling && " (Annual Billing)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Consultations Used</span>
            <span className="font-medium">{usedConsultations} of {consultationsTotal}</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {consultationsRemaining} consultations remaining
            </span>
            {consultationsRemaining <= 3 && (
              <div className="flex items-center text-xs text-amber-500">
                <InfoIcon className="h-3 w-3 mr-1" />
                <span>Running low</span>
              </div>
            )}
          </div>
        </div>
        
        {nextBillingDate && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>Next billing date</span>
            </div>
            <span className="text-sm font-medium">
              {format(nextBillingDate, 'MMM d, yyyy')}
            </span>
          </div>
        )}
        
        <div className="space-y-2 pt-2">
          <Link to="/pricing">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          </Link>
          
          <Link to="/consultation-purchase">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Buy More Consultations
            </Button>
          </Link>
          
          {canUpgrade && nextTier && (
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              Upgrade to {getSubscriptionTierName(nextTier)}
            </Button>
          )}
        </div>
      </CardContent>
      
      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {nextTier && (
            <SubscriptionCheckout
              tier={nextTier}
              price={getNextTierPrice()}
              isAnnual={isAnnualBilling}
              onSuccess={() => {
                setUpgradeDialogOpen(false);
                refreshSubscriptionInfo();
              }}
              onCancel={() => setUpgradeDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

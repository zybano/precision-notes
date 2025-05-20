import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, CreditCard, InfoIcon, PlusCircle, RefreshCw } from "lucide-react";
import { getSubscriptionTierName } from "@/services/subscriptionService";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { SubscriptionCheckout } from "@/components/subscription/SubscriptionCheckout";
import { fetchSubscriptionPlans } from "@/services/payment/subscriptionService";
import { getCreditInfo, formatExpiryDate, isAlmostExpired, getDaysRemaining } from "@/services/payment/simpleCreditService.ts";

export const SubscriptionUsage = () => {
  const { subscriptionInfo, refreshSubscriptionInfo } = useAuth();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creditInfo, setCreditInfo] = useState<{
    balance: number;
    totalUsed: number;
    totalEarned: number;
    expiresAt: Date | null;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Load both subscription plans and credit info
      const [plansResult, creditResult] = await Promise.all([
        fetchSubscriptionPlans(),
        getCreditInfo()
      ]);

      if (plansResult.success && plansResult.plans) {
        setAvailablePlans(plansResult.plans);
      }

      if (creditResult.success && creditResult.data) {
        setCreditInfo(creditResult.data);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([
      refreshSubscriptionInfo(),
      getCreditInfo().then(result => {
        if (result.success && result.data) {
          setCreditInfo(result.data);
        }
      })
    ]);
    setIsLoading(false);
  };

  if (!subscriptionInfo) {
    return null;
  }

  const { tier, nextBillingDate, isAnnualBilling } = subscriptionInfo;

  // Use creditInfo for consultation usage data instead of subscriptionInfo
  const balance = creditInfo?.balance || 0;
  const totalUsed = creditInfo?.totalUsed || 0;
  const totalEarned = creditInfo?.totalEarned || 0;
  const expiresAt = creditInfo?.expiresAt;

  // Calculate percentage based on total earned rather than subscription consultations
  const usagePercentage = totalEarned > 0 ? Math.floor((totalUsed / totalEarned) * 100) : 0;

  // Check if credits are expiring soon
  const expirationWarning = isAlmostExpired(expiresAt);
  const daysRemaining = getDaysRemaining(expiresAt);

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

  // Get next tier details from available plans
  const getNextTierPlan = () => {
    if (!nextTier || availablePlans.length === 0) return null;
    return availablePlans.find(plan => plan.tier === nextTier);
  };

  const nextTierPlan = getNextTierPlan();

  // Format price for display
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Your Subscription</CardTitle>
            <Button
                variant="ghost"
                size="icon"
                onClick={refreshData}
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
          {/* Credit Balance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Available Credits</span>
              <span className="text-xl font-bold">{balance}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Credits Used</span>
              <span className="font-medium">{totalUsed} of {totalEarned}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />

            {/* Credit expiration info */}
            {expiresAt && (
                <div className="flex items-center text-sm justify-between mt-1">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className={expirationWarning ? "text-amber-500" : "text-muted-foreground"}>
                  {expirationWarning
                      ? `Expires in ${daysRemaining} days`
                      : `Expires: ${formatExpiryDate(expiresAt)}`}
                </span>
                  </div>

                  {balance <= 3 && balance > 0 && (
                      <div className="flex items-center text-xs text-amber-500">
                        <InfoIcon className="h-3 w-3 mr-1" />
                        <span>Running low</span>
                      </div>
                  )}
                </div>
            )}
          </div>

          {/* Billing information */}
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

          {/* Actions */}
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
                Buy More Credits
              </Button>
            </Link>

            {canUpgrade && nextTier && (
                <Button
                    variant="default"
                    className="w-full"
                    onClick={() => setUpgradeDialogOpen(true)}
                    disabled={isLoading}
                >
                  {isLoading ? "Loading..." : `Upgrade to ${getSubscriptionTierName(nextTier)}`}
                </Button>
            )}
          </div>
        </CardContent>

        {/* Upgrade Dialog */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            {nextTier && nextTierPlan && (
                <SubscriptionCheckout
                    tier={nextTier}
                    price={isAnnualBilling ? formatPrice(nextTierPlan.price_annual) : formatPrice(nextTierPlan.price_monthly)}
                    isAnnual={isAnnualBilling}
                    onSuccess={() => {
                      setUpgradeDialogOpen(false);
                      refreshData();
                    }}
                    onCancel={() => setUpgradeDialogOpen(false)}
                />
            )}
          </DialogContent>
        </Dialog>
      </Card>
  );
};
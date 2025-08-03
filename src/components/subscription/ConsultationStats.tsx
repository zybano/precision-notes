import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import {Button} from "@/components/ui/button";
import {ChartPieIcon, Clock, PlusCircle, RefreshCw} from "lucide-react";
import {Link} from "react-router-dom";
import {
  formatExpiryDate,
  getCreditInfo,
  getDaysRemaining,
  isAlmostExpired
} from "@/services/payment/simpleCreditService.ts";

export const ConsultationStats = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [creditInfo, setCreditInfo] = useState<{
    balance: number;
    totalUsed: number;
    totalEarned: number;
    expiresAt: Date | null;
  } | null>(null);

  const loadCreditInfo = async () => {
    setIsLoading(true);
    try {
      const result = await getCreditInfo();
      if (result.success && result.data) {
        setCreditInfo(result.data);
      }
    } catch (error) {
      console.error("Error loading credit info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCreditInfo();
  }, []);

  if (isLoading) {
    return (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Credit Balance</CardTitle>
              <Button
                  variant="ghost"
                  size="icon"
                  disabled
                  className="h-8 w-8"
              >
                <RefreshCw className="h-4 w-4 animate-spin" />
              </Button>
            </div>
            <CardDescription>
              Loading your credits...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
    );
  }

  if (!creditInfo) {
    return null;
  }

  const { balance, totalUsed, totalEarned, expiresAt } = creditInfo;
  const totalCredits = balance + totalUsed;
  const usagePercentage = totalCredits > 0 ? Math.floor((totalUsed / totalCredits) * 100) : 0;

  // Check if credits are expiring soon
  const expirationWarning = isAlmostExpired(expiresAt);
  const daysRemaining = getDaysRemaining(expiresAt);

  return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Credit Balance</CardTitle>
            <Button
                variant="ghost"
                size="icon"
                onClick={loadCreditInfo}
                className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Your document generation credits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <ChartPieIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Available Credits</p>
              <div className="text-2xl font-bold">{balance}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{usagePercentage}%</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Used: {totalUsed}</span>
              <span>Total: {totalEarned}</span>
            </div>
          </div>

          {expiresAt && (
              <div className="flex items-center text-sm space-x-2 pt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={expirationWarning ? "text-amber-500" : "text-muted-foreground"}>
              {expirationWarning
                  ? `Expires in ${daysRemaining} days`
                  : `Expires: ${formatExpiryDate(expiresAt)}`}
            </span>
              </div>
          )}

          <Button variant="outline" className="w-full flex items-center justify-center" asChild>
            <Link to="/consultation-purchase">
              <PlusCircle className="mr-2 h-4 w-4" />
              Buy More Credits
            </Link>
          </Button>
        </CardContent>
      </Card>
  );
};
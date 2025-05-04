
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChartPieIcon, PlusCircle, RefreshCw } from "lucide-react";
import { getSubscriptionTierName } from "@/services/subscriptionService";
import { Link } from "react-router-dom";

export const ConsultationStats = () => {
  const { subscriptionInfo, refreshSubscriptionInfo } = useAuth();
  
  console.log('📈 ConsultationStats render. SubscriptionInfo:', subscriptionInfo);
  
  if (!subscriptionInfo) {
    console.log('❌ ConsultationStats: No subscription info');
    return null;
  }
  
  const { consultationsRemaining, consultationsTotal } = subscriptionInfo;
  const usedConsultations = consultationsTotal - consultationsRemaining;
  const usagePercentage = Math.floor((usedConsultations / consultationsTotal) * 100);
  
  console.log('🧮 Consultation stats:', {
    total: consultationsTotal,
    remaining: consultationsRemaining,
    used: usedConsultations,
    percentage: usagePercentage
  });
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Consultation Stats</CardTitle>
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
          Track your consultation usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <ChartPieIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Consultations Used</p>
            <div className="text-2xl font-bold">{usedConsultations} of {consultationsTotal}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usage</span>
            <span>{usagePercentage}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{consultationsRemaining} consultations remaining</span>
          </div>
        </div>
        
        <Button variant="outline" className="w-full flex items-center justify-center" asChild>
          <Link to="/consultation-purchase">
            <PlusCircle className="mr-2 h-4 w-4" />
            Buy More Consultations
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

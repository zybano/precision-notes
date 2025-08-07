import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface UsageData {
  total_requests: number;
  request_limit: number;
  remaining_requests: number;
  is_limit_exceeded: boolean;
}

interface UsageInfoProps {
  usage: UsageData;
  className?: string;
}

const UsageInfo: React.FC<UsageInfoProps> = ({ usage, className = '' }) => {
  if (!usage) {
    return null;
  }

  const usagePercentage = ((usage.total_requests / usage.request_limit) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usage.is_limit_exceeded || usagePercentage >= 100;

  const getUsageColor = () => {
    if (isOverLimit) return 'text-red-600';
    if (isNearLimit) return 'text-orange-600';
    return 'text-green-600';
  };

  const getUsageBadgeVariant = () => {
    if (isOverLimit) return 'destructive';
    if (isNearLimit) return 'secondary';
    return 'default';
  };

  const getUsageIcon = () => {
    if (isOverLimit) return AlertTriangle;
    if (isNearLimit) return TrendingUp;
    return CheckCircle;
  };

  const UsageIcon = getUsageIcon();

  return (
    <Card className={className}>
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-xs md:text-sm">
          <div className="flex items-center min-w-0">
            <Activity className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
            <span className="truncate">Organization Usage</span>
          </div>
          <Badge variant={getUsageBadgeVariant()} className="text-xs flex-shrink-0">
            <UsageIcon className="h-2 w-2 md:h-3 md:w-3 mr-1" />
            <span className="hidden sm:inline">
              {isOverLimit ? 'Limit Exceeded' : isNearLimit ? 'Near Limit' : 'Active'}
            </span>
            <span className="sm:hidden">
              {isOverLimit ? 'Over' : isNearLimit ? 'Near' : 'OK'}
            </span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 md:space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className="text-muted-foreground">Requests Used</span>
            <span className={`font-medium ${getUsageColor()}`}>
              {usage.total_requests.toLocaleString()} / {usage.request_limit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={Math.min(usagePercentage, 100)} 
            className="h-1 md:h-2"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{usagePercentage.toFixed(1)}% used</span>
            <span className="hidden sm:inline">{usage.remaining_requests.toLocaleString()} remaining</span>
            <span className="sm:hidden">{usage.remaining_requests.toLocaleString()} left</span>
          </div>
        </div>

        {isOverLimit && (
          <div className="flex items-start space-x-2 p-2 md:p-3 bg-red-50 rounded-md border border-red-200">
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700">
              <p className="font-medium">Usage limit exceeded</p>
              <p className="hidden sm:block">Contact your administrator to increase your request limit.</p>
              <p className="sm:hidden">Contact admin to increase limit.</p>
            </div>
          </div>
        )}

        {isNearLimit && !isOverLimit && (
          <div className="flex items-start space-x-2 p-2 md:p-3 bg-orange-50 rounded-md border border-orange-200">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-700">
              <p className="font-medium">Approaching usage limit</p>
              <p className="hidden sm:block">You have {usage.remaining_requests} requests remaining this period.</p>
              <p className="sm:hidden">{usage.remaining_requests} requests left.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xs md:text-sm font-medium">{usage.total_requests.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Limit</p>
            <p className="text-xs md:text-sm font-medium">{usage.request_limit.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Left</p>
            <p className={`text-xs md:text-sm font-medium ${getUsageColor()}`}>
              {usage.remaining_requests.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageInfo;
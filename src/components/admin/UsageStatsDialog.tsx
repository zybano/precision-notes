import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, BarChart, TrendingUp, Clock, FileText, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

interface UsageStats {
  total_requests: number;
  total_credits_used: number;
  total_processing_time_ms: number;
  requests_by_date: Array<{
    date: string;
    requests: number;
    credits_used: number;
  }>;
  requests_by_document_type: Array<{
    document_type: string;
    requests: number;
    credits_used: number;
  }>;
  requests_by_hour: Array<{
    hour: number;
    requests: number;
  }>;
  average_processing_time_ms: number;
  error_rate: number;
}

interface UsageStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
}

const SUPABASE_URL = "https://rdjzeayewevditzekveb.supabase.co";

export function UsageStatsDialog({
  open,
  onOpenChange,
  organization
}: UsageStatsDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      const endDate = new Date();

      const params = new URLSearchParams({
        organization_id: organization.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/b2b-organization-management/usage?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      setError('Failed to fetch usage statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsageStats();
    }
  }, [open, organization.id, dateRange]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usage Statistics</DialogTitle>
          <DialogDescription>
            Detailed usage analytics for {organization.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="flex items-center gap-4">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Date Range:</span>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="space-y-0 pb-2">
                      <Skeleton className="h-4 w-20" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : stats ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_requests.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      API calls in selected period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_credits_used.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Total credits consumed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(stats.average_processing_time_ms)}</div>
                    <p className="text-xs text-muted-foreground">
                      Average response time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats.error_rate * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Failed requests
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Document Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Usage by Document Type
                  </CardTitle>
                  <CardDescription>
                    Requests and credits used per document format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.requests_by_document_type.length > 0 ? (
                      stats.requests_by_document_type.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{item.document_type}</Badge>
                            <span className="text-sm font-medium">{item.requests} requests</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{item.credits_used} credits</div>
                            <div className="text-xs text-muted-foreground">
                              {item.requests > 0 ? (item.credits_used / item.requests).toFixed(1) : 0} avg per request
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No document generation requests in this period</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity</CardTitle>
                  <CardDescription>
                    Requests and credits used per day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.requests_by_date.length > 0 ? (
                      stats.requests_by_date.slice(-14).map((item, index) => {
                        const date = new Date(item.date);
                        const maxRequests = Math.max(...stats.requests_by_date.map(d => d.requests));
                        const width = maxRequests > 0 ? (item.requests / maxRequests) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-20 text-xs text-muted-foreground">
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex-1">
                              <div className="bg-muted rounded-full h-2 relative">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right text-xs w-20">
                              <div className="font-medium">{item.requests} req</div>
                              <div className="text-muted-foreground">{item.credits_used} credits</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No activity in this period</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Pattern */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Pattern by Hour</CardTitle>
                  <CardDescription>
                    Request volume throughout the day (24-hour format)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1">
                    {stats.requests_by_hour.map((item, index) => {
                      const maxRequests = Math.max(...stats.requests_by_hour.map(h => h.requests));
                      const height = maxRequests > 0 ? Math.max((item.requests / maxRequests) * 40, 2) : 2;
                      
                      return (
                        <div key={index} className="flex flex-col items-center space-y-1">
                          <div 
                            className="bg-primary rounded-sm w-full transition-all hover:bg-primary/80"
                            style={{ height: `${height}px` }}
                            title={`${item.hour}:00 - ${item.requests} requests`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.hour.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

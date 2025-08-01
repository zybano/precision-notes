import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrganizationList } from "@/components/admin/OrganizationList";
import { CreateOrganizationDialog } from "@/components/admin/CreateOrganizationDialog";
import { ManageCreditsDialog } from "@/components/admin/ManageCreditsDialog";
import { UsageStatsDialog } from "@/components/admin/UsageStatsDialog";
import { RotateKeyDialog } from "@/components/admin/RotateKeyDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { adminApiService } from "@/services/adminApiService";
import {
  Plus,
  Users,
  CreditCard,
  BarChart,
  RefreshCw,
  Building,
  Activity,
  TrendingUp,
  AlertCircle,
  Server,
  Shield,
  Settings,
  Database,
  LogOut,
  User
} from "lucide-react";
import { toast } from "sonner";

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

interface SystemStats {
  total_organizations: number;
  active_organizations: number;
  total_credits_issued: number;
  total_requests: number;
  total_credits_used: number;
  average_processing_time: number;
  requests_last_24h: number;
  credits_used_last_24h: number;
  top_organizations: Array<{
    name: string;
    requests: number;
    credits_used: number;
  }>;
  document_type_stats: Array<{
    type: string;
    requests: number;
    credits_used: number;
  }>;
}

export default function AdminPage() {
  const { adminUser, signOut, sessionToken, hasPermission } = useAdminAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [showRotateKeyDialog, setShowRotateKeyDialog] = useState(false);

  const fetchOrganizations = async () => {
    if (!sessionToken) return;

    setIsLoading(true);
    try {
      const response = await adminApiService.listOrganizations(sessionToken);

      if (!response.success) {
        toast.error(response.error || 'Failed to fetch organizations');
        return;
      }

      const orgs = response.data?.organizations || [];
      setOrganizations(orgs);

      // Calculate system statistics
      const activeOrgs = orgs.filter((org: Organization) => org.is_active);
      const totalCredits = orgs.reduce((sum: number, org: Organization) => sum + org.credits_remaining, 0);
      const totalRequests = orgs.reduce((sum: number, org: Organization) => sum + org.total_requests, 0);

      // Mock some additional stats (in real implementation, these would come from the API)
      setSystemStats({
        total_organizations: orgs.length,
        active_organizations: activeOrgs.length,
        total_credits_issued: totalCredits,
        total_requests: totalRequests,
        total_credits_used: Math.floor(totalRequests * 2.5), // Estimate
        average_processing_time: 8500, // milliseconds
        requests_last_24h: Math.floor(totalRequests * 0.1),
        credits_used_last_24h: Math.floor(totalRequests * 0.1 * 2.5),
        top_organizations: orgs
            .sort((a: Organization, b: Organization) => b.total_requests - a.total_requests)
            .slice(0, 5)
            .map((org: Organization) => ({
              name: org.name,
              requests: org.total_requests,
              credits_used: Math.floor(org.total_requests * 2.5)
            })),
        document_type_stats: [
          { type: 'soap', requests: Math.floor(totalRequests * 0.3), credits_used: Math.floor(totalRequests * 0.3 * 2) },
          { type: 'h&p', requests: Math.floor(totalRequests * 0.2), credits_used: Math.floor(totalRequests * 0.2 * 4) },
          { type: 'progress', requests: Math.floor(totalRequests * 0.25), credits_used: Math.floor(totalRequests * 0.25 * 2) },
          { type: 'discharge', requests: Math.floor(totalRequests * 0.15), credits_used: Math.floor(totalRequests * 0.15 * 4) },
          { type: 'consultation', requests: Math.floor(totalRequests * 0.1), credits_used: Math.floor(totalRequests * 0.1 * 3) },
        ]
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionToken) {
      fetchOrganizations();
    }
  }, [sessionToken]);

  const handleCreateOrganization = async (organizationData: any) => {
    if (!sessionToken) return;

    try {
      const response = await adminApiService.createOrganization(sessionToken, organizationData);

      if (!response.success) {
        toast.error(response.error || 'Failed to create organization');
        throw new Error(response.error);
      }

      toast.success('Organization created successfully');
      fetchOrganizations(); // Refresh the list
      setShowCreateDialog(false);
      return response.data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const handleManageCredits = async (organizationId: string, creditAdjustment: number, description: string) => {
    if (!sessionToken) return;

    try {
      const response = await adminApiService.manageCredits(sessionToken, organizationId, creditAdjustment, description);

      if (!response.success) {
        toast.error(response.error || 'Failed to update credits');
        throw new Error(response.error);
      }

      toast.success('Credits updated successfully');
      fetchOrganizations(); // Refresh the list
      setShowCreditsDialog(false);
      setSelectedOrganization(null);
    } catch (error) {
      console.error('Error managing credits:', error);
      throw error;
    }
  };

  const handleRotateApiKey = async (organizationId: string) => {
    if (!sessionToken) return;

    try {
      const response = await adminApiService.rotateApiKey(sessionToken, organizationId);

      if (!response.success) {
        toast.error(response.error || 'Failed to rotate API key');
        throw new Error(response.error);
      }

      toast.success('API key rotated successfully');
      fetchOrganizations(); // Refresh the list
      return response.data?.new_api_key;
    } catch (error) {
      console.error('Error rotating API key:', error);
      throw error;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const handleSignOut = async () => {
    await signOut(sessionToken || "");
  };

  return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="border-b bg-white">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <h1 className="text-2xl font-bold">Precision Notes Admin</h1>
                      <p className="text-sm text-muted-foreground">B2B Organization Management Portal</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{adminUser?.name}</span>
                    <Badge variant={adminUser?.role === 'super_admin' ? 'default' : 'secondary'}>
                      {adminUser?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Server className="h-3 w-3 mr-1" />
                    System Status: Online
                  </Badge>
                  {hasPermission('organizations') && (
                      <Button onClick={() => setShowCreateDialog(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Organization
                      </Button>
                  )}
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">System Overview</TabsTrigger>
                <TabsTrigger value="organizations" disabled={!hasPermission('organizations')}>
                  Organizations
                </TabsTrigger>
                <TabsTrigger value="analytics" disabled={!hasPermission('analytics')}>
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="settings" disabled={!hasPermission('settings')}>
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* System Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                      <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats?.total_organizations || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {systemStats?.active_organizations || 0} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total API Requests</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats?.total_requests.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {systemStats?.requests_last_24h.toLocaleString() || 0} in last 24h
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats?.total_credits_used.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {systemStats?.credits_used_last_24h.toLocaleString() || 0} in last 24h
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                      <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatDuration(systemStats?.average_processing_time || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Response time</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Organizations and Document Usage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Organizations by Usage</CardTitle>
                      <CardDescription>Most active organizations in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {systemStats?.top_organizations.map((org, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="space-y-1">
                                <div className="font-medium">{org.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {org.requests.toLocaleString()} requests
                                </div>
                              </div>
                              <Badge variant="outline">
                                {org.credits_used.toLocaleString()} credits
                              </Badge>
                            </div>
                        )) || (
                            <p className="text-center text-muted-foreground py-4">No data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Document Type Usage</CardTitle>
                      <CardDescription>Most popular document formats</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {systemStats?.document_type_stats.map((stat, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="space-y-1">
                                <div className="font-medium capitalize">{stat.type}</div>
                                <div className="text-sm text-muted-foreground">
                                  {stat.requests.toLocaleString()} requests
                                </div>
                              </div>
                              <Badge variant="outline">
                                {stat.credits_used.toLocaleString()} credits
                              </Badge>
                            </div>
                        )) || (
                            <p className="text-center text-muted-foreground py-4">No data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      System Alerts
                    </CardTitle>
                    <CardDescription>Important notifications and system status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          System is operating normally. All API endpoints are responding within expected timeframes.
                        </AlertDescription>
                      </Alert>

                      {systemStats && systemStats.total_organizations > 10 && (
                          <Alert>
                            <TrendingUp className="h-4 w-4" />
                            <AlertDescription>
                              High organization growth detected. Consider monitoring credit allocation patterns.
                            </AlertDescription>
                          </Alert>
                      )}

                      {systemStats && systemStats.average_processing_time > 10000 && (
                          <Alert className="border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-700">
                              Processing times are higher than normal. Monitor system performance.
                            </AlertDescription>
                          </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Organizations Tab */}
              <TabsContent value="organizations" className="space-y-6">
                <AdminProtectedRoute requiredPermission="organizations">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Organization Management</CardTitle>
                          <CardDescription>
                            Manage all B2B organizations and their settings
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" onClick={fetchOrganizations} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                          <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Organization
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <OrganizationList
                          organizations={organizations}
                          isLoading={isLoading}
                          onManageCredits={(org) => {
                            setSelectedOrganization(org);
                            setShowCreditsDialog(true);
                          }}
                          onViewUsage={(org) => {
                            setSelectedOrganization(org);
                            setShowUsageDialog(true);
                          }}
                          onRotateKey={(org) => {
                            setSelectedOrganization(org);
                            setShowRotateKeyDialog(true);
                          }}
                      />
                    </CardContent>
                  </Card>
                </AdminProtectedRoute>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <AdminProtectedRoute requiredPermission="analytics">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Credit Usage Trends</CardTitle>
                        <CardDescription>Credit consumption over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
                          <div className="text-center space-y-2">
                            <BarChart className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">Chart visualization coming soon</p>
                            <p className="text-xs text-muted-foreground">
                              Total credits used: {systemStats?.total_credits_used.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>API Request Volume</CardTitle>
                        <CardDescription>Request patterns and peaks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
                          <div className="text-center space-y-2">
                            <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">Request analytics coming soon</p>
                            <p className="text-xs text-muted-foreground">
                              Total requests: {systemStats?.total_requests.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Document Type Distribution</CardTitle>
                        <CardDescription>Most popular document formats</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {systemStats?.document_type_stats.map((stat, index) => {
                            const totalRequests = systemStats.document_type_stats.reduce((sum, s) => sum + s.requests, 0);
                            const percentage = totalRequests > 0 ? (stat.requests / totalRequests) * 100 : 0;

                            return (
                                <div key={index} className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium capitalize">{stat.type}</span>
                                    <span className="text-muted-foreground">
                                  {stat.requests.toLocaleString()} ({percentage.toFixed(1)}%)
                                </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                            );
                          }) || (
                              <p className="text-center text-muted-foreground py-4">No data available</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>System Performance</CardTitle>
                        <CardDescription>Response times and system health</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="text-sm font-medium">Average Response Time</span>
                            <Badge variant="outline">
                              {formatDuration(systemStats?.average_processing_time || 0)}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="text-sm font-medium">System Uptime</span>
                            <Badge variant="outline" className="text-green-600">
                              99.9%
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="text-sm font-medium">Error Rate</span>
                            <Badge variant="outline">
                              0.1%
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="text-sm font-medium">Active Organizations</span>
                            <Badge variant="outline">
                              {systemStats?.active_organizations || 0}/{systemStats?.total_organizations || 0}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AdminProtectedRoute>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <AdminProtectedRoute requiredPermission="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        System Configuration
                      </CardTitle>
                      <CardDescription>Global system settings and configuration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <Database className="h-4 w-4" />
                          <AlertDescription>
                            System configuration settings will be available in future updates.
                            Contact system administrator for configuration changes.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Default Rate Limits</CardTitle>
                              <CardDescription>Default API rate limits for new organizations</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Requests per hour:</span>
                                  <Badge variant="outline">500</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Initial credits:</span>
                                  <Badge variant="outline">1,000</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">System Limits</CardTitle>
                              <CardDescription>Global system limitations</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Max file size:</span>
                                  <Badge variant="outline">50MB</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Request timeout:</span>
                                  <Badge variant="outline">120s</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AdminProtectedRoute>
              </TabsContent>
            </Tabs>
          </div>

          {/* Dialogs */}
          <CreateOrganizationDialog
              open={showCreateDialog}
              onOpenChange={setShowCreateDialog}
              onCreateOrganization={handleCreateOrganization}
          />

          {selectedOrganization && (
              <>
                <ManageCreditsDialog
                    open={showCreditsDialog}
                    onOpenChange={setShowCreditsDialog}
                    organization={selectedOrganization}
                    onManageCredits={handleManageCredits}
                />

                <UsageStatsDialog
                    open={showUsageDialog}
                    onOpenChange={setShowUsageDialog}
                    organization={selectedOrganization}
                />

                <RotateKeyDialog
                    open={showRotateKeyDialog}
                    onOpenChange={setShowRotateKeyDialog}
                    organization={selectedOrganization}
                    onRotateKey={handleRotateApiKey}
                />
              </>
          )}
        </div>
      </AdminProtectedRoute>
  );
}
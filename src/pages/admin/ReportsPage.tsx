import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import AdminFormField from '@/components/admin/AdminFormField';
import {AdminMetricTile, AdminSectionPanel, AdminTableShell} from '@/components/admin/AdminSurface';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import type {Tenant} from '@/types/platformAdmin';
import {Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Activity, Building2, CircleDollarSign, CreditCard, ShieldCheck} from 'lucide-react';

export default function ReportsPage() {
  const { sessionToken } = useAdminAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const organizationsQuery = useQuery({
    queryKey: ['reports', 'organizations'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listOrganizations(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load organizations');
      return (response.data as Tenant[]) || [];
    },
  });

  const overviewQuery = useQuery({
    queryKey: ['reports', 'platform-analytics', 'overview'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getPlatformAnalyticsOverview(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load platform overview analytics');
      return response.data;
    },
  });

  const revenueQuery = useQuery({
    queryKey: ['reports', 'platform-analytics', 'revenue'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getPlatformAnalyticsRevenue(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load platform revenue analytics');
      return response.data;
    },
  });

  const planAdoptionQuery = useQuery({
    queryKey: ['reports', 'platform-analytics', 'plan-adoption'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getPlatformAnalyticsPlanAdoption(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load platform plan adoption analytics');
      return response.data;
    },
  });

  const providerPerformanceQuery = useQuery({
    queryKey: ['reports', 'platform-analytics', 'provider-performance'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getPlatformAnalyticsProviderPerformance(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load platform provider performance analytics');
      return response.data;
    },
  });

  const usageQuery = useQuery({
    queryKey: ['reports', 'usage', startDate, endDate],
    enabled: false,
    queryFn: async () => {
      const response = await adminApiService.getReportingUsage(sessionToken as string, startDate || undefined, endDate || undefined);
      if (!response.success) throw new Error(response.error || 'Failed to load usage report');
      return response.data as {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageProcessingTimeMs: number;
      };
    },
  });

  const organizations = useMemo(() => organizationsQuery.data || [], [organizationsQuery.data]);

  const metrics = useMemo(() => {
    const overview = overviewQuery.data;
    const revenueItems = revenueQuery.data?.items || [];
    const revenueCents = revenueItems.reduce((sum, item) => sum + (item.totalAmountCents || 0), 0);

    return {
      totalOrganizations: overview?.totalOrganizations ?? organizations.length,
      activeOrganizations: overview?.activeOrganizations ?? organizations.filter((org) => org.isActive).length,
      totalRequests: overview?.totalRequests ?? organizations.reduce((sum, org) => sum + (org.totalRequests || 0), 0),
      aiActionsRemaining: overview?.totalAiActionsRemaining ?? 0,
      transcriptionSecondsRemaining: overview?.totalTranscriptionSecondsRemaining ?? 0,
      revenueCents,
    };
  }, [organizations, overviewQuery.data, revenueQuery.data?.items]);

  const topOrganizations = useMemo(
    () => [...organizations].sort((a, b) => (b.totalRequests || 0) - (a.totalRequests || 0)).slice(0, 8),
    [organizations]
  );

  const requestTrendData = useMemo(() => {
    const items = planAdoptionQuery.data?.items || [];
    return items
      .map((item) => ({ period: item.planName, requests: item.count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 12);
  }, [planAdoptionQuery.data?.items]);

  const providerSplitData = useMemo(() => {
    const items = providerPerformanceQuery.data?.items || [];
    return items.map((item) => ({ provider: item.provider.toUpperCase(), count: item.totalTransactions }));
  }, [providerPerformanceQuery.data?.items]);

  const successFailureData = useMemo(() => {
    if (usageQuery.data) {
      const pending = Math.max(
        usageQuery.data.totalRequests - usageQuery.data.successfulRequests - usageQuery.data.failedRequests,
        0
      );

      return [
        { label: 'Success', value: usageQuery.data.successfulRequests },
        { label: 'Failed', value: usageQuery.data.failedRequests },
        { label: 'Pending', value: pending },
      ];
    }

    const items = providerPerformanceQuery.data?.items || [];
    const counters = items.reduce(
      (acc, item) => {
        acc.success += item.succeededTransactions || 0;
        acc.failed += item.failedTransactions || 0;
        const pendingForProvider = Math.max(
          (item.totalTransactions || 0) - (item.succeededTransactions || 0) - (item.failedTransactions || 0),
          0
        );
        acc.pending += pendingForProvider;
        return acc;
      },
      { success: 0, failed: 0, pending: 0 }
    );

    return [
      { label: 'Success', value: counters.success },
      { label: 'Failed', value: counters.failed },
      { label: 'Pending', value: counters.pending },
    ];
  }, [providerPerformanceQuery.data?.items, usageQuery.data]);

  const dateError = useMemo(() => {
    if (!startDate || !endDate) return '';
    if (startDate > endDate) return 'Start date must be before end date.';
    return '';
  }, [endDate, startDate]);

  if (!sessionToken) {
    return (
      <div className="space-y-6">
        <PlatformModuleHeader
          title="Reports"
          description="Operational and executive reporting for tenant usage and platform health."
        />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Sign in as platform admin to view reports.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformModuleHeader
        title="Reports"
        description="Operational and executive reporting for tenant usage and platform health."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <AdminMetricTile label="Organizations" value={metrics.totalOrganizations} helper="Total tenants" icon={<Building2 className="h-4 w-4" />} tone="info" />
        <AdminMetricTile label="Active Orgs" value={metrics.activeOrganizations} helper="Currently active" icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
        <AdminMetricTile label="Total Requests" value={metrics.totalRequests} helper="Platform usage" icon={<Activity className="h-4 w-4" />} />
        <AdminMetricTile label="AI Actions Remaining" value={metrics.aiActionsRemaining} helper="Billing V2" icon={<CreditCard className="h-4 w-4" />} />
        <AdminMetricTile label="Transcription Seconds" value={metrics.transcriptionSecondsRemaining} helper="Billing V2" icon={<CreditCard className="h-4 w-4" />} />
        <AdminMetricTile label="Revenue (cents)" value={metrics.revenueCents} helper="Captured revenue" icon={<CircleDollarSign className="h-4 w-4" />} tone="success" />
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Plan Adoption</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={requestTrendData}>
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="#0f766e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provider Split</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={providerSplitData} dataKey="count" nameKey="provider" outerRadius={85} innerRadius={40}>
                    {providerSplitData.map((entry, index) => (
                      <Cell key={entry.provider} fill={['#0f766e', '#1d4ed8', '#f59e0b', '#6b7280'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success/Failure</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={successFailureData}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {successFailureData.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={entry.label === 'Success' ? '#16a34a' : entry.label === 'Failed' ? '#dc2626' : '#64748b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <AdminSectionPanel title="Usage Report Query" description="Run bounded usage reports for a selected date window.">
            <div className="grid gap-3 md:grid-cols-4">
              <AdminFormField label="Start Date" htmlFor="reports-start-date">
                <Input id="reports-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </AdminFormField>
              <AdminFormField label="End Date" htmlFor="reports-end-date">
                <Input id="reports-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </AdminFormField>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => usageQuery.refetch()}
                  disabled={usageQuery.isFetching || Boolean(dateError)}
                >
                  {usageQuery.isFetching ? 'Loading...' : 'Run Report'}
                </Button>
              </div>
              <div className="flex items-end">
                <Badge variant="outline">Platform Reporting Endpoint</Badge>
              </div>
            </div>
            {dateError && <p className="text-xs text-destructive mt-2">{dateError}</p>}

            {usageQuery.isError && (
              <Alert className="mt-4">
                <AlertTitle>Report Endpoint Access Warning</AlertTitle>
                <AlertDescription>
                  {(usageQuery.error as Error).message}. Try refreshing or verify the reporting endpoint authorization for your platform admin account.
                </AlertDescription>
              </Alert>
            )}

            {usageQuery.data && (
              <div className="grid gap-4 mt-4 md:grid-cols-2 xl:grid-cols-5">
                <AdminMetricTile label="Total" value={usageQuery.data.totalRequests} />
                <AdminMetricTile label="Successful" value={usageQuery.data.successfulRequests} tone="success" />
                <AdminMetricTile label="Failed" value={usageQuery.data.failedRequests} tone="danger" />
                <AdminMetricTile label="Avg Proc. (ms)" value={Math.round(usageQuery.data.averageProcessingTimeMs || 0)} />
              </div>
            )}
        </AdminSectionPanel>

        <AdminSectionPanel title="Top Organizations by Requests" description="Highest-request tenants from the currently loaded organization set.">
            <AdminTableShell>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizationsQuery.isLoading && (
                  <TableRow><TableCell colSpan={3}>Loading organizations...</TableCell></TableRow>
                )}
                {topOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? 'default' : 'secondary'}>{org.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell>{org.totalRequests || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </AdminTableShell>
        </AdminSectionPanel>

        {(overviewQuery.isError || revenueQuery.isError || planAdoptionQuery.isError || providerPerformanceQuery.isError) && (
          <Alert>
            <AlertTitle>Platform Analytics Load Warning</AlertTitle>
            <AlertDescription>
              One or more platform analytics endpoints failed to load. Check backend availability and platform admin permissions.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

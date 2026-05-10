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
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import type {PaymentTransaction, Tenant} from '@/types/platformAdmin';
import {Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

const requiredAdditions = [
  'GET /platform-admin/analytics/overview',
  'GET /platform-admin/analytics/revenue',
  'GET /platform-admin/analytics/plan-adoption',
  'GET /platform-admin/analytics/provider-performance',
];

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

  const transactionsQuery = useQuery({
    queryKey: ['reports', 'transactions'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listPaymentTransactions(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load payment transactions');
      return (Array.isArray(response.data) ? response.data : []) as PaymentTransaction[];
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
        totalCreditsUsed: number;
        averageProcessingTimeMs: number;
      };
    },
  });

  const organizations = useMemo(() => organizationsQuery.data || [], [organizationsQuery.data]);
  const transactions = useMemo(() => transactionsQuery.data || [], [transactionsQuery.data]);

  const metrics = useMemo(() => {
    const activeOrgs = organizations.filter((org) => org.isActive).length;
    const totalRequests = organizations.reduce((sum, org) => sum + (org.totalRequests || 0), 0);
    const credits = organizations.reduce((sum, org) => sum + (org.credits || 0), 0);
    const revenueCents = transactions.reduce((sum, tx) => sum + (tx.amountCents || 0), 0);

    return {
      totalOrganizations: organizations.length,
      activeOrganizations: activeOrgs,
      totalRequests,
      credits,
      revenueCents,
    };
  }, [organizations, transactions]);

  const topOrganizations = useMemo(
    () => [...organizations].sort((a, b) => (b.totalRequests || 0) - (a.totalRequests || 0)).slice(0, 8),
    [organizations]
  );

  const requestTrendData = useMemo(() => {
    const monthly = new Map<string, number>();

    organizations.forEach((org) => {
      const dateValue = org.createdAt || org.updatedAt;
      const bucket = dateValue ? dateValue.slice(0, 7) : 'unknown';
      monthly.set(bucket, (monthly.get(bucket) || 0) + (org.totalRequests || 0));
    });

    return [...monthly.entries()]
      .map(([period, requests]) => ({ period, requests }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12);
  }, [organizations]);

  const providerSplitData = useMemo(() => {
    const byProvider = new Map<string, number>();
    transactions.forEach((tx) => {
      const provider = (tx.provider || 'unknown').toUpperCase();
      byProvider.set(provider, (byProvider.get(provider) || 0) + 1);
    });

    return [...byProvider.entries()].map(([provider, count]) => ({ provider, count }));
  }, [transactions]);

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

    const counters = transactions.reduce(
      (acc, tx) => {
        const status = (tx.status || '').toUpperCase();
        if (['SUCCEEDED', 'SUCCESS', 'COMPLETED', 'PAID', 'ACTIVE'].includes(status)) {
          acc.success += 1;
        } else if (['FAILED', 'ERROR', 'CANCELED', 'CANCELLED', 'DECLINED'].includes(status)) {
          acc.failed += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { success: 0, failed: 0, pending: 0 }
    );

    return [
      { label: 'Success', value: counters.success },
      { label: 'Failed', value: counters.failed },
      { label: 'Pending', value: counters.pending },
    ];
  }, [transactions, usageQuery.data]);

  const dateError = useMemo(() => {
    if (!startDate || !endDate) return '';
    if (startDate > endDate) return 'Start date must be before end date.';
    return '';
  }, [endDate, startDate]);

  if (!sessionToken) {
    return (
      <div>
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
    <div>
      <PlatformModuleHeader
        title="Reports"
        description="Operational and executive reporting for tenant usage and platform health."
      />

      <div className="grid gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Organizations</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{metrics.totalOrganizations}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Orgs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">{metrics.activeOrganizations}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{metrics.totalRequests}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Credits Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{metrics.credits}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue (cents)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{metrics.revenueCents}</CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Request Trend</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Usage Report Query</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Badge variant="outline">B2B Reporting Endpoint</Badge>
              </div>
            </div>
            {dateError && <p className="text-xs text-destructive mt-2">{dateError}</p>}

            {usageQuery.isError && (
              <Alert className="mt-4">
                <AlertTitle>Report Endpoint Access Warning</AlertTitle>
                <AlertDescription>
                  {(usageQuery.error as Error).message}. This endpoint is currently b2b-auth oriented and may require backend adaptation for platform admin context.
                </AlertDescription>
              </Alert>
            )}

            {usageQuery.data && (
              <div className="grid gap-4 mt-4 md:grid-cols-2 xl:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold">{usageQuery.data.totalRequests}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Successful</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold text-emerald-600">{usageQuery.data.successfulRequests}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Failed</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold text-destructive">{usageQuery.data.failedRequests}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Credits Used</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold">{usageQuery.data.totalCreditsUsed}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Proc. (ms)</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold">{Math.round(usageQuery.data.averageProcessingTimeMs || 0)}</CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Organizations by Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizationsQuery.isLoading && (
                  <TableRow><TableCell colSpan={4}>Loading organizations...</TableCell></TableRow>
                )}
                {topOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? 'default' : 'secondary'}>{org.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell>{org.totalRequests || 0}</TableCell>
                    <TableCell>{org.credits || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Alert>
          <AlertTitle>Platform Analytics Extension Needed</AlertTitle>
          <AlertDescription>
            Cross-tenant executive analytics should move to dedicated platform endpoints:
            <ul className="list-disc pl-4 mt-2 space-y-1">
              {requiredAdditions.map((endpoint) => (
                <li key={endpoint}>{endpoint}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

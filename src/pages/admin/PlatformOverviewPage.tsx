import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {UsersRound, ChevronRight, FileText, Box, RefreshCw, CreditCard} from 'lucide-react';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {AdminMetricStrip, AdminSectionPanel} from '@/components/admin/AdminSurface';
import {BillingOwnersTable, formatCapturedPayment} from '@/components/admin/billing/BillingUsageView';
import {Button} from '@/components/ui/button';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';

export default function PlatformOverviewPage() {
  const {sessionToken} = useAdminAuth();
  const overview = useQuery({queryKey: ['reports', 'platform-analytics', 'overview'], enabled: Boolean(sessionToken), queryFn: async () => {
    const result = await adminApiService.getPlatformAnalyticsOverview(sessionToken!);
    if (!result.success || !result.data) throw new Error(result.error || 'Unable to load overview'); return result.data;
  }});
  const usage = useQuery({queryKey: ['billing-usage', 'B2B'], enabled: Boolean(sessionToken), queryFn: async () => {
    const result = await adminApiService.getBillingUsage(sessionToken!, {ownerType: 'B2B'});
    if (!result.success || !result.data) throw new Error(result.error || 'Unable to load usage'); return result.data;
  }});
  const revenue = useQuery({queryKey: ['reports', 'platform-analytics', 'revenue'], enabled: Boolean(sessionToken), queryFn: async () => {
    const result = await adminApiService.getPlatformAnalyticsRevenue(sessionToken!);
    if (!result.success || !result.data) throw new Error(result.error || 'Unable to load captured payments'); return result.data;
  }});
  return <div className="space-y-6">
    <PlatformModuleHeader title="Overview" description="Organizations, permanent balances, and metered usage." actions={<Button onClick={() => {void overview.refetch(); void usage.refetch(); void revenue.refetch();}} disabled={overview.isFetching || usage.isFetching || revenue.isFetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>} />
    <AdminMetricStrip items={[
      {label: 'Organizations', value: overview.data?.totalOrganizations ?? '—'},
      {label: 'Active organizations', value: overview.data?.activeOrganizations ?? '—', success: true},
      {label: 'Captured payments', value: overview.data?.succeededPaymentTransactions ?? '—'},
      {label: 'Paid organization subscriptions', value: overview.data?.paidOrganizationSubscriptions ?? '—'},
    ]} />
    {overview.isError && <p role="alert" className="text-sm text-destructive">{overview.error.message}</p>}
    <AdminSectionPanel title="Organization usage" actions={<><span className="text-sm text-slate-500">All time</span><Button asChild variant="ghost"><Link to="/admin/reports">Open reports</Link></Button></>}>
      <BillingOwnersTable compact owners={usage.data?.owners || []} loading={usage.isLoading} error={usage.isError ? usage.error.message : undefined} />
    </AdminSectionPanel>
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <AdminSectionPanel title="Billing policy"><div className="space-y-6 py-2">
        {['AI actions and transcription time', 'Admin grants and top-ups do not expire', 'Trials and plan allowances follow their billing periods'].map(text => <p key={text} className="flex items-center gap-5 text-sm"><FileText className="h-5 w-5 shrink-0 text-slate-500" />{text}</p>)}
      </div></AdminSectionPanel>
      <AdminSectionPanel title="Quick actions"><div className="divide-y divide-slate-100">
        {[{label: 'Manage organizations', to: '/admin/organizations', icon: UsersRound}, {label: 'Review plans', to: '/admin/plans-billing', icon: CreditCard}, {label: 'Open sandbox', to: '/admin/sandbox', icon: Box}].map(item => <Link key={item.to} to={item.to} className="flex items-center gap-5 py-4 text-sm hover:text-blue-600"><item.icon className="h-5 w-5 text-slate-500" />{item.label}<ChevronRight className="ml-auto h-4 w-4" /></Link>)}
      </div></AdminSectionPanel>
    </div>
    <AdminSectionPanel title="Captured payments">
      {revenue.isError ? <p role="alert" className="text-sm text-destructive">{revenue.error.message}</p> : revenue.isLoading ? <p className="py-5 text-sm text-slate-500">Loading captured payments…</p> : !revenue.data?.items.length ? <div className="py-3 text-center text-sm text-slate-500"><p>No captured payments</p><p className="mt-2 text-xs">Captured payments will appear here, separated by currency.</p></div> : <div className="flex flex-wrap gap-8">{revenue.data.items.map(item => <div key={item.currency}><p className="text-sm text-slate-500">{item.currency}</p><p className="mt-2 text-xl font-semibold">{formatCapturedPayment(item.totalAmountCents, item.currency)}</p></div>)}</div>}
    </AdminSectionPanel>
  </div>;
}

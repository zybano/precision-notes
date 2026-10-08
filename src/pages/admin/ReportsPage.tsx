import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Download} from 'lucide-react';
import {Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {AdminMetricStrip, AdminSectionPanel, AdminTableShell} from '@/components/admin/AdminSurface';
import {BillingOwnersTable, formatCapturedPayment, formatDuration, formatQuantity} from '@/components/admin/billing/BillingUsageView';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';

type Scope = 'B2B' | 'B2C' | 'ALL';
const sourceName = (source: string) => ({ADMIN_ADJUSTMENT: 'Admin grants', TOP_UP: 'Purchased top-ups', FREE_TRIAL: 'Free trial', WEEKLY_INCLUDED: 'Plan allowance'}[source] || source);
const utcDate = (date: Date) => date.toISOString().slice(0, 10);
export default function ReportsPage() {
  const {sessionToken} = useAdminAuth();
  const [scope, setScope] = useState<Scope>('B2B');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [range, setRange] = useState('all');
  const [applied, setApplied] = useState({startDate: '', endDate: ''});
  const dateError = startDate && endDate && startDate > endDate ? 'Start date must be before end date.' : '';
  const usage = useQuery({queryKey: ['billing-usage', scope, applied], enabled: Boolean(sessionToken), queryFn: async () => {
    const response = await adminApiService.getBillingUsage(sessionToken!, {ownerType: scope === 'ALL' ? undefined : scope, startDate: applied.startDate || undefined, endDate: applied.endDate || undefined});
    if (!response.success || !response.data) throw new Error(response.error || 'Unable to load billing usage'); return response.data;
  }});
  const revenue = useQuery({queryKey: ['reports', 'platform-analytics', 'revenue'], enabled: Boolean(sessionToken), queryFn: async () => {
    const response = await adminApiService.getPlatformAnalyticsRevenue(sessionToken!);
    if (!response.success || !response.data) throw new Error(response.error || 'Unable to load captured payments'); return response.data;
  }});
  const changeRange = (value: string) => {
    setRange(value);
    if (value === 'custom') return;
    const end = utcDate(new Date()); const start = new Date(); start.setUTCDate(start.getUTCDate() - (value === '7' ? 6 : 29));
    const dates = value === 'all' ? {startDate: '', endDate: ''} : {startDate: utcDate(start), endDate: end};
    setStartDate(dates.startDate); setEndDate(dates.endDate); setApplied(dates);
  };
  const exportCsv = () => {
    if (!usage.data) return;
    const cell = (value: unknown) => {let text = String(value ?? ''); if (/^[=+@-]/.test(text)) text = `'${text}`; return `"${text.replace(/"/g, '""')}"`;};
    const rows = [['Customer', 'Scope', 'Start date (UTC)', 'End date (UTC)', 'AI actions used', 'Transcription seconds used', 'Completed actions', 'Available AI actions now', 'Available transcription seconds now', 'Balance snapshot at'], ...usage.data.owners.map(owner => [owner.ownerName, owner.ownerType, applied.startDate || 'All time', applied.endDate || '', owner.aiActionsUsed, owner.transcriptionSecondsUsed, owner.completedActions, owner.remainingAiActions, owner.remainingTranscriptionSeconds, usage.data!.generatedAt])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8;'}));
    const link = document.createElement('a'); link.href = url; link.download = `billing-usage-${scope.toLowerCase()}-${utcDate(new Date())}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  const totals = usage.data?.totals;
  const daily = usage.data?.daily.map(day => ({...day, transcriptionMinutes: day.transcriptionSecondsUsed / 60})) || [];
  return <div className="space-y-6">
    <PlatformModuleHeader title="Reports" description="Usage from the Billing v2 ledger." actions={<Button variant="outline" onClick={exportCsv} disabled={!usage.data || usage.isFetching}><Download className="mr-2 h-4 w-4" />Export CSV</Button>} />
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mr-auto flex flex-wrap gap-1" aria-label="Customer scope">{([{value: 'B2B', label: 'Organizations'}, {value: 'B2C', label: 'Individuals'}, {value: 'ALL', label: 'All customers'}] as const).map(item => <Button key={item.value} aria-pressed={scope === item.value} variant={scope === item.value ? 'secondary' : 'ghost'} className={scope === item.value ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : ''} onClick={() => setScope(item.value)}>{item.label}</Button>)}</div>
      <div className="space-y-2"><Label htmlFor="report-range">Range</Label><select id="report-range" className="h-10 rounded-md border bg-white px-3 text-sm" value={range} onChange={event => changeRange(event.target.value)}><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="custom">Custom</option></select></div>
      <div className="space-y-2"><Label htmlFor="report-start">Start date</Label><Input id="report-start" type="date" className="w-40" value={startDate} onChange={event => {setRange('custom'); setStartDate(event.target.value);}} /></div>
      <div className="space-y-2"><Label htmlFor="report-end">End date</Label><Input id="report-end" type="date" className="w-40" value={endDate} onChange={event => {setRange('custom'); setEndDate(event.target.value);}} /></div>
      <Button disabled={Boolean(dateError) || usage.isFetching} onClick={() => {setApplied({startDate, endDate}); if (applied.startDate === startDate && applied.endDate === endDate) void usage.refetch();}}>Apply</Button>
      {dateError && <p role="alert" className="w-full text-sm text-destructive">{dateError}</p>}
    </div>
    <AdminMetricStrip items={[
      {label: 'AI actions used', value: formatQuantity(totals?.aiActionsUsed)},
      {label: 'Transcription used', value: formatDuration(totals?.transcriptionSecondsUsed)},
      {label: 'Completed actions', value: formatQuantity(totals?.completedActions)},
      {label: 'Reserved now', value: formatQuantity(totals?.reservedAiActions), helper: `${formatDuration(totals?.reservedTranscriptionSeconds)} transcription`},
    ]} />
    <AdminSectionPanel title="Customer consumption" description="Usage follows the selected dates in UTC. Available balances are a current snapshot.">
      <BillingOwnersTable owners={usage.data?.owners || []} loading={usage.isLoading} error={usage.isError ? usage.error.message : undefined} />
    </AdminSectionPanel>
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <AdminSectionPanel title="Daily usage" description="AI actions and transcription minutes, settled in UTC.">
        {usage.isError ? <p className="text-sm text-destructive">Usage unavailable</p> : !daily.length ? <p className="py-20 text-center text-sm text-slate-500">{usage.isLoading ? 'Loading daily usage…' : 'No committed usage in this range.'}</p> : <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={daily} margin={{top: 10, right: 8, left: -20, bottom: 0}}><CartesianGrid vertical={false} stroke="#edf0f5" /><XAxis dataKey="date" tick={{fontSize: 11}} minTickGap={35} /><YAxis yAxisId="actions" allowDecimals={false} tick={{fontSize: 11}} /><YAxis yAxisId="minutes" orientation="right" tick={{fontSize: 11}} /><Tooltip /><Legend wrapperStyle={{fontSize: 12}} /><Line yAxisId="actions" dataKey="aiActionsUsed" name="AI actions" stroke="#2563eb" strokeWidth={2} dot={{r: 3}} /><Line yAxisId="minutes" dataKey="transcriptionMinutes" name="Transcription minutes" stroke="#059669" strokeWidth={2} dot={{r: 3}} /></LineChart></ResponsiveContainer></div>}
      </AdminSectionPanel>
      <AdminSectionPanel title="Grant sources" description="Committed usage allocated to each grant source."><AdminTableShell><Table><TableHeader><TableRow><TableHead>Source</TableHead><TableHead>AI actions</TableHead><TableHead>Transcription</TableHead></TableRow></TableHeader><TableBody>
        {!usage.data?.sources.length && <TableRow><TableCell colSpan={3} className="text-slate-500">{usage.isLoading ? 'Loading sources…' : usage.isError ? 'Usage unavailable' : 'No committed usage.'}</TableCell></TableRow>}
        {usage.data?.sources.map(source => <TableRow key={source.source}><TableCell>{sourceName(source.source)}</TableCell><TableCell>{formatQuantity(source.aiActionsUsed)}</TableCell><TableCell>{formatDuration(source.transcriptionSecondsUsed)}</TableCell></TableRow>)}
      </TableBody></Table></AdminTableShell></AdminSectionPanel>
    </div>
    <AdminSectionPanel title="Captured payments" description="All-time successful payments across the platform, separated by currency. Usage filters apply to the ledger report above.">
      {revenue.isError ? <p role="alert" className="text-sm text-destructive">{revenue.error.message}</p> : !revenue.data?.items.length ? <p className="py-6 text-center text-sm text-slate-500">{revenue.isLoading ? 'Loading captured payments…' : 'No captured payments'}</p> : <AdminTableShell><Table><TableHeader><TableRow><TableHead>Currency</TableHead><TableHead>Captured amount</TableHead><TableHead>Payments</TableHead></TableRow></TableHeader><TableBody>{revenue.data.items.map(item => <TableRow key={item.currency}><TableCell>{item.currency}</TableCell><TableCell>{formatCapturedPayment(item.totalAmountCents, item.currency)}</TableCell><TableCell>{item.transactionCount}</TableCell></TableRow>)}</TableBody></Table></AdminTableShell>}
    </AdminSectionPanel>
  </div>;
}

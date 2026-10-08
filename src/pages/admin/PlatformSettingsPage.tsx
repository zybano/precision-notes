import {useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {AdminSectionPanel, AdminStatusPill, AdminTableShell} from '@/components/admin/AdminSurface';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService, type PartnerCreditSettingsUpdate} from '@/services/adminApiService';
import {RefreshCw} from 'lucide-react';
import {toast} from 'sonner';

export default function PlatformSettingsPage() {
  const { sessionToken } = useAdminAuth();
  const queryClient = useQueryClient();
  const [creditSettings, setCreditSettings] = useState<PartnerCreditSettingsUpdate | null>(null);

  const configQuery = useQuery({
    queryKey: ['platform-admin', 'system-config'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getSystemConfig(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load system configuration');
      }
      return (response.data || {}) as Record<string, unknown>;
    },
  });

  const configRows = useMemo(() => {
    if (!configQuery.data || typeof configQuery.data !== 'object') {
      return [];
    }
    return Object.entries(configQuery.data);
  }, [configQuery.data]);

  const creditsQuery = useQuery({
    queryKey: ['platform-admin', 'partner-credits'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getPartnerCreditDashboard(sessionToken as string);
      if (!response.success || !response.data) throw new Error(response.error || 'Failed to load partner credit monitoring');
      return response.data;
    },
  });

  useEffect(() => {
    if (!creditsQuery.data || creditSettings) return;
    const {settings, admins} = creditsQuery.data;
    setCreditSettings({
      enabled: settings.enabled,
      checkIntervalMinutes: settings.checkIntervalMinutes,
      warningThresholdPercent: settings.warningThresholdPercent,
      balanceWarningAmount: settings.balanceWarningAmount,
      alertCooldownMinutes: settings.alertCooldownMinutes,
      recipientAdminIds: admins.filter((admin) => admin.selected).map((admin) => admin.id),
    });
  }, [creditsQuery.data, creditSettings]);

  const saveCredits = useMutation({
    mutationFn: async () => {
      if (!creditSettings) throw new Error('Partner credit settings are not loaded');
      const response = await adminApiService.updatePartnerCreditSettings(sessionToken as string, creditSettings);
      if (!response.success) throw new Error(response.error || 'Failed to save partner credit settings');
      return response.data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(['platform-admin', 'partner-credits'], data);
      toast.success('Partner credit alerts updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const checkCredits = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.checkPartnerCreditsNow(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Partner credit check failed');
      return response.data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(['platform-admin', 'partner-credits'], data);
      toast.success('Partner balances checked');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateNumber = (field: keyof PartnerCreditSettingsUpdate, value: string) => {
    setCreditSettings((current) => current ? {...current, [field]: Number(value)} : current);
  };

  const numberError = creditSettings && (
    !Number.isInteger(creditSettings.checkIntervalMinutes) || creditSettings.checkIntervalMinutes < 5 || creditSettings.checkIntervalMinutes > 1440 ||
    !Number.isFinite(creditSettings.warningThresholdPercent) || creditSettings.warningThresholdPercent < 1 || creditSettings.warningThresholdPercent > 90 ||
    !Number.isFinite(creditSettings.balanceWarningAmount) || creditSettings.balanceWarningAmount < 0 ||
    !Number.isInteger(creditSettings.alertCooldownMinutes) || creditSettings.alertCooldownMinutes < 5 || creditSettings.alertCooldownMinutes > 10080
  ) ? 'Enter valid monitoring values within the displayed limits.' : '';
  return <div className="space-y-6">
    <PlatformModuleHeader title="Settings" description="Provider balances, alerts, and runtime configuration." actions={<Button onClick={() => checkCredits.mutate()} disabled={checkCredits.isPending || !creditsQuery.data}><RefreshCw className="mr-2 h-4 w-4" />{checkCredits.isPending ? 'Checking…' : 'Check balances'}</Button>} />
    <AdminSectionPanel title="Provider balances">
      {creditsQuery.isError && <Alert><AlertTitle>Unable to load partner monitoring</AlertTitle><AlertDescription>{creditsQuery.error.message}</AlertDescription></Alert>}
      <AdminTableShell><Table><TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Monitor mode</TableHead><TableHead>Status</TableHead><TableHead>Available / limit</TableHead><TableHead>Last checked</TableHead></TableRow></TableHeader><TableBody>
        {creditsQuery.isLoading && <TableRow><TableCell colSpan={5}>Loading provider balances…</TableCell></TableRow>}
        {creditsQuery.data?.providers.map(provider => <TableRow key={provider.provider}><TableCell className="font-medium">{provider.provider === 'openai' ? 'OpenAI' : provider.provider === 'deepgram' ? 'Deepgram' : provider.provider}</TableCell><TableCell>{provider.monitorMode === 'SPEND_LIMIT' ? 'Spend limit' : provider.monitorMode === 'BALANCE' ? 'Balance' : 'Error signal'}</TableCell><TableCell><AdminStatusPill tone={provider.state === 'HEALTHY' ? 'success' : ['LOW','EXHAUSTED','CHECK_FAILED'].includes(provider.state) ? 'warning' : 'neutral'}>{provider.state.toLowerCase().replace(/_/g,' ')}</AdminStatusPill></TableCell><TableCell>{provider.remainingAmount == null ? '—' : `${provider.remainingAmount} ${provider.currency || ''}`}{provider.limitAmount != null && <p className="mt-1 text-xs text-slate-500">Limit: {provider.limitAmount} {provider.currency}</p>}<p className="mt-1 max-w-xs text-xs text-slate-500">{provider.message}</p></TableCell><TableCell>{provider.lastCheckedAt ? new Date(provider.lastCheckedAt).toLocaleString() : 'Not checked'}</TableCell></TableRow>)}
      </TableBody></Table></AdminTableShell>
    </AdminSectionPanel>
    {creditSettings && <div className="grid gap-4 lg:grid-cols-2">
      <AdminSectionPanel title="Monitoring settings" contentClassName="space-y-6">
        <div className="flex items-center justify-between"><Label htmlFor="credit-monitor-enabled">Automatic checks</Label><Switch id="credit-monitor-enabled" checked={creditSettings.enabled} onCheckedChange={enabled => setCreditSettings({...creditSettings, enabled})} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="check-interval">Check interval (minutes)</Label><Input id="check-interval" type="number" min={5} max={1440} value={creditSettings.checkIntervalMinutes} onChange={event => updateNumber('checkIntervalMinutes', event.target.value)} /><p className="text-xs text-slate-500">5–1,440 minutes</p></div>
          <div className="space-y-2"><Label htmlFor="warning-percent">Spend warning threshold (%)</Label><Input id="warning-percent" type="number" min={1} max={90} value={creditSettings.warningThresholdPercent} onChange={event => updateNumber('warningThresholdPercent', event.target.value)} /><p className="text-xs text-slate-500">1–90% remaining</p></div>
          <div className="space-y-2"><Label htmlFor="balance-warning">Balance warning (USD)</Label><Input id="balance-warning" type="number" min={0} step="0.01" value={creditSettings.balanceWarningAmount} onChange={event => updateNumber('balanceWarningAmount', event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="alert-cooldown">Alert cooldown (minutes)</Label><Input id="alert-cooldown" type="number" min={5} max={10080} value={creditSettings.alertCooldownMinutes} onChange={event => updateNumber('alertCooldownMinutes', event.target.value)} /><p className="text-xs text-slate-500">5–10,080 minutes</p></div>
        </div>
        {numberError && <p role="alert" className="text-sm text-destructive">{numberError}</p>}
      </AdminSectionPanel>
      <AdminSectionPanel title="Alert recipients" description="Select platform operators to receive balance alerts." contentClassName="flex flex-col gap-4">
        <div className="min-h-48 space-y-2 rounded-md border border-slate-200 p-4">
          {!creditsQuery.data?.admins.length && <p className="py-14 text-center text-sm text-slate-500">No recipients available</p>}
          {creditsQuery.data?.admins.map(admin => <label key={admin.id} className="flex cursor-pointer items-center gap-3 rounded-md p-3 text-sm hover:bg-slate-50"><input type="checkbox" checked={creditSettings.recipientAdminIds.includes(admin.id)} onChange={event => setCreditSettings({...creditSettings, recipientAdminIds: event.target.checked ? [...creditSettings.recipientAdminIds, admin.id] : creditSettings.recipientAdminIds.filter(id => id !== admin.id)})} /><span><span className="block font-medium">{admin.name || admin.email}</span><span className="text-xs text-slate-500">{admin.email}</span></span></label>)}
          {Boolean(creditsQuery.data?.admins.length) && !creditSettings.recipientAdminIds.length && <p className="text-xs text-slate-500">No recipients selected</p>}
        </div>
        <Button className="w-full" onClick={() => saveCredits.mutate()} disabled={saveCredits.isPending || Boolean(numberError)}>{saveCredits.isPending ? 'Saving…' : 'Save settings'}</Button>
      </AdminSectionPanel>
    </div>}
    <AdminSectionPanel title="Runtime configuration" description="Read from the current platform configuration.">
      {configQuery.isError && <p role="alert" className="text-sm text-destructive">{configQuery.error.message}</p>}
      {configQuery.isLoading && <p className="text-sm text-slate-500">Loading configuration…</p>}
      <dl className="divide-y divide-slate-100">{configRows.map(([key,value]) => <div key={key} className="grid gap-2 py-3 text-sm sm:grid-cols-[240px_1fr]"><dt className="font-medium">{key}</dt><dd className="text-slate-500">{Array.isArray(value) ? value.join(', ') : String(value)}</dd></div>)}</dl>
    </AdminSectionPanel>
  </div>;
}

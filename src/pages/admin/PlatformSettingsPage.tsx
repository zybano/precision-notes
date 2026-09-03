import {useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {AdminMetricTile, AdminSectionPanel, AdminStatusPill, AdminTableShell} from '@/components/admin/AdminSurface';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService, type PartnerCreditSettingsUpdate} from '@/services/adminApiService';
import {KeyRound, RefreshCw, Settings2, WalletCards} from 'lucide-react';
import {toast} from 'sonner';

const controls = [
  { name: 'Audit log retention policy', status: 'Defined' },
  { name: 'Default organization policy template', status: 'Defined' },
  { name: 'Webhook retry and timeout policy', status: 'Defined' },
  { name: 'Provider failover strategy', status: 'Live in Sandbox' },
  { name: 'Global feature flags', status: 'Governed' },
];

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

  if (!sessionToken) {
    return (
      <div className="space-y-6">
        <PlatformModuleHeader
          title="Settings"
          description="Centralized configuration for platform-level operational policies."
        />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Sign in as platform admin to access settings.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformModuleHeader
        title="Settings"
        description="Centralized configuration for platform-level operational policies."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricTile
          label="Settings API"
          value={configQuery.isError ? 'Unavailable' : configQuery.isSuccess ? 'Connected' : 'Checking'}
          helper="System config endpoint"
          icon={<Settings2 className="h-4 w-4" />}
          tone={configQuery.isError ? 'warning' : 'success'}
        />
        <AdminMetricTile
          label="Loaded Config Keys"
          value={configRows.length}
          helper="Returned platform keys"
          icon={<KeyRound className="h-4 w-4" />}
        />
        <AdminMetricTile
          label="Partner Credit Monitor"
          value={creditsQuery.isError ? 'Unavailable' : creditSettings?.enabled ? 'Active' : 'Paused'}
          helper={`${creditsQuery.data?.providers.filter((provider) => provider.state === 'LOW' || provider.state === 'EXHAUSTED').length || 0} providers need attention`}
          icon={<WalletCards className="h-4 w-4" />}
          tone={creditsQuery.data?.providers.some((provider) => provider.state === 'LOW' || provider.state === 'EXHAUSTED') ? 'warning' : 'success'}
        />
      </div>

      <AdminSectionPanel
        title="Partner Credit Monitoring"
        description="Check provider balances before requests fail and email the selected platform admins."
        actions={<Button size="sm" variant="outline" onClick={() => checkCredits.mutate()} disabled={checkCredits.isPending || creditsQuery.isLoading}><RefreshCw className="mr-2 h-4 w-4" />{checkCredits.isPending ? 'Checking...' : 'Check now'}</Button>}
        contentClassName="space-y-5"
      >
        {creditsQuery.isError && <Alert><AlertTitle>Unable to load partner monitoring</AlertTitle><AlertDescription>{(creditsQuery.error as Error).message}</AlertDescription></Alert>}
        {creditSettings && creditsQuery.data && (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {creditsQuery.data.providers.map((provider) => (
                <Card key={provider.provider}>
                  <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base capitalize">{provider.provider}</CardTitle><AdminStatusPill>{provider.state.replace('_', ' ')}</AdminStatusPill></div></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">{provider.remainingAmount == null ? 'Balance unavailable' : `${provider.remainingAmount} ${provider.currency || ''} remaining`}</p>
                    <p className="text-xs text-muted-foreground">{provider.message}</p>
                    <p className="text-xs text-muted-foreground">{provider.lastCheckedAt ? `Checked ${new Date(provider.lastCheckedAt).toLocaleString()}` : 'Not checked yet'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-md border p-4">
              <div><Label htmlFor="credit-monitor-enabled">Automatic checks and alerts</Label><p className="text-xs text-muted-foreground">Runs in the backend even when the admin portal is closed.</p></div>
              <Switch id="credit-monitor-enabled" checked={creditSettings.enabled} onCheckedChange={(enabled) => setCreditSettings({...creditSettings, enabled})} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2"><Label htmlFor="check-interval">Check every (minutes)</Label><Input id="check-interval" type="number" min={5} max={1440} value={creditSettings.checkIntervalMinutes} onChange={(event) => updateNumber('checkIntervalMinutes', event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="warning-percent">Spend remaining warning (%)</Label><Input id="warning-percent" type="number" min={1} max={90} value={creditSettings.warningThresholdPercent} onChange={(event) => updateNumber('warningThresholdPercent', event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="balance-warning">Balance warning (USD)</Label><Input id="balance-warning" type="number" min={0} step="0.01" value={creditSettings.balanceWarningAmount} onChange={(event) => updateNumber('balanceWarningAmount', event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="alert-cooldown">Repeat alert after (minutes)</Label><Input id="alert-cooldown" type="number" min={5} max={10080} value={creditSettings.alertCooldownMinutes} onChange={(event) => updateNumber('alertCooldownMinutes', event.target.value)} /></div>
            </div>

            <div className="space-y-2">
              <Label>Notify platform admins</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {creditsQuery.data.admins.map((admin) => (
                  <label key={admin.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
                    <input type="checkbox" checked={creditSettings.recipientAdminIds.includes(admin.id)} onChange={(event) => setCreditSettings({...creditSettings, recipientAdminIds: event.target.checked ? [...creditSettings.recipientAdminIds, admin.id] : creditSettings.recipientAdminIds.filter((id) => id !== admin.id)})} />
                    <span><span className="block font-medium">{admin.name || admin.email}</span><span className="text-xs text-muted-foreground">{admin.email}</span></span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={() => saveCredits.mutate()} disabled={saveCredits.isPending}>{saveCredits.isPending ? 'Saving...' : 'Save monitoring settings'}</Button>
          </>
        )}
      </AdminSectionPanel>

      <AdminSectionPanel title="Operational Control Areas" description="Governed platform policies and operational guardrails.">
          <div className="space-y-3">
            {controls.map((control) => (
              <div key={control.name} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium">{control.name}</span>
                <AdminStatusPill>{control.status}</AdminStatusPill>
              </div>
            ))}
          </div>
      </AdminSectionPanel>

      <AdminSectionPanel
        title="Current Platform Configuration"
        description="Raw configuration values returned by the platform."
        actions={(
          <Button size="sm" variant="outline" onClick={() => configQuery.refetch()} disabled={configQuery.isFetching}>
            {configQuery.isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
        contentClassName="space-y-3"
      >
          {configQuery.isLoading && <p className="text-sm text-muted-foreground">Loading system configuration...</p>}

          {configRows.length > 0 && (
            <AdminTableShell>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configRows.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-mono text-xs">{key}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </AdminTableShell>
          )}

          {!configQuery.isLoading && !configQuery.isError && configRows.length === 0 && (
            <p className="text-sm text-muted-foreground">No platform settings returned yet.</p>
          )}

          {configQuery.isError && (
            <Alert>
              <AlertTitle>Unable to load platform settings</AlertTitle>
              <AlertDescription>{(configQuery.error as Error).message}</AlertDescription>
            </Alert>
          )}
      </AdminSectionPanel>
    </div>
  );
}

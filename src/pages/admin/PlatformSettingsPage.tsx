import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {AdminMetricTile, AdminSectionPanel, AdminStatusPill, AdminTableShell} from '@/components/admin/AdminSurface';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import {KeyRound, Settings2} from 'lucide-react';

const controls = [
  { name: 'Audit log retention policy', status: 'Defined' },
  { name: 'Default organization policy template', status: 'Defined' },
  { name: 'Webhook retry and timeout policy', status: 'Defined' },
  { name: 'Provider failover strategy', status: 'Live in Sandbox' },
  { name: 'Global feature flags', status: 'Governed' },
];

export default function PlatformSettingsPage() {
  const { sessionToken } = useAdminAuth();

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
      </div>

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

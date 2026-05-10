import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';

const controls = [
  { name: 'Audit log retention policy', status: 'Defined' },
  { name: 'Default organization policy template', status: 'Defined' },
  { name: 'Webhook retry and timeout policy', status: 'Defined' },
  { name: 'Provider failover strategy', status: 'Live in Sandbox' },
  { name: 'Global feature flags', status: 'Governed' },
];

const endpointContracts = [
  { endpoint: 'GET /platform-admin/config', status: 'Pending backend' },
  { endpoint: 'PUT /platform-admin/config', status: 'Pending backend' },
];

export default function PlatformSettingsPage() {
  return (
    <div>
      <PlatformModuleHeader
        title="Settings"
        description="Centralized configuration for platform-level operational policies."
      />

      <Card>
        <CardHeader>
          <CardTitle>Operational Control Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {controls.map((control) => (
              <div key={control.name} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm font-medium">{control.name}</span>
                <Badge variant="outline">{control.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Settings API Contract Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {endpointContracts.map((contract) => (
            <div key={contract.endpoint} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="font-mono text-xs">{contract.endpoint}</span>
              <Badge variant="secondary">{contract.status}</Badge>
            </div>
          ))}

          <Alert>
            <AlertTitle>Backend Wiring Remaining</AlertTitle>
            <AlertDescription>
              Platform settings now use real operational definitions, but persistence endpoints are pending backend implementation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

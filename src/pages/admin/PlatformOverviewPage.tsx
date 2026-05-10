import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {BarChart3, Building2, FlaskConical, ShieldCheck, Wallet} from 'lucide-react';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';

const modules = [
  {
    title: 'Organizations',
    description: 'Manage platform organizations, credits, API keys, and lifecycle state.',
    icon: Building2,
    status: 'Active',
  },
  {
    title: 'Plans and Billing',
    description: 'Configure plans, feature limits, prices, and organization contract plans.',
    icon: Wallet,
    status: 'Active',
  },
  {
    title: 'Reports',
    description: 'Track usage, staff utilization, activity, and platform-wide KPIs.',
    icon: BarChart3,
    status: 'In Progress',
  },
  {
    title: 'Sandbox',
    description: 'Test provider configurations and transcription workflows safely.',
    icon: FlaskConical,
    status: 'Active',
  },
  {
    title: 'Platform Admins',
    description: 'Manage platform admin identities, permissions, and sessions.',
    icon: ShieldCheck,
    status: 'Needs API',
  },
];

export default function PlatformOverviewPage() {
  return (
    <div>
      <PlatformModuleHeader
        title="Platform Overview"
        description="Central command center for organization, billing, reporting, and sandbox operations."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{module.title}</CardTitle>
              <module.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
              <Badge variant={module.status === 'Active' ? 'default' : 'secondary'}>{module.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

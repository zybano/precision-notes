import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {BarChart3, Building2, ChevronRight, FlaskConical, ShieldCheck, Wallet} from 'lucide-react';
import {Link} from 'react-router-dom';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';

export default function PlatformOverviewPage() {
  const { sessionToken } = useAdminAuth();

  const adminUsersHealthQuery = useQuery({
    queryKey: ['platform-overview', 'admin-users-health'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listAdminUsers(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to connect to platform admins API');
      }
      return true;
    },
  });

  const platformAdminsStatus = !sessionToken
    ? 'Sign In Required'
    : adminUsersHealthQuery.isLoading
      ? 'Checking'
      : adminUsersHealthQuery.isSuccess
        ? 'Active'
        : 'In Progress';

  const modules = [
    {
      title: 'Organizations',
      description: 'Manage platform organizations, credits, API keys, and lifecycle state.',
      icon: Building2,
      status: 'Active',
      to: '/admin/organizations',
    },
    {
      title: 'Plans and Billing',
      description: 'Configure plans, feature limits, prices, and organization contract plans.',
      icon: Wallet,
      status: 'Active',
      to: '/admin/plans-billing',
    },
    {
      title: 'Reports',
      description: 'Track usage, staff utilization, activity, and platform-wide KPIs.',
      icon: BarChart3,
      status: 'In Progress',
      to: '/admin/reports',
    },
    {
      title: 'Sandbox',
      description: 'Test provider configurations and transcription workflows safely.',
      icon: FlaskConical,
      status: 'Active',
      to: '/admin/sandbox',
    },
    {
      title: 'Platform Admins',
      description: 'Manage platform admin identities, permissions, and sessions.',
      icon: ShieldCheck,
      status: platformAdminsStatus,
      to: '/admin/platform-admins',
    },
  ];

  return (
    <div className="space-y-6">
      <PlatformModuleHeader
        title="Platform Overview"
        description="Central command center for organization, billing, reporting, and sandbox operations."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.title} to={module.to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/30 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{module.title}</CardTitle>
                <module.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={module.status === 'Active' ? 'default' : 'secondary'}>{module.status}</Badge>
                  <span className="inline-flex items-center text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Open
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';

const endpointRows = [
  { endpoint: 'POST /platform-admin/auth/login', status: 'available' },
  { endpoint: 'POST /platform-admin/auth/logout', status: 'available' },
  { endpoint: 'GET /platform-admin/users', status: 'available' },
  { endpoint: 'POST /platform-admin/users', status: 'available' },
  { endpoint: 'PATCH /platform-admin/users/{adminId}', status: 'available' },
  { endpoint: 'POST /platform-admin/users/{adminId}/disable', status: 'available' },
  { endpoint: 'POST /platform-admin/users/{adminId}/reset-password', status: 'available' },
  { endpoint: 'GET /platform-admin/sessions', status: 'available' },
  { endpoint: 'DELETE /platform-admin/sessions/{sessionId}', status: 'available' },
] as const;

export default function PlatformAdminsPage() {
  const { sessionToken, adminUser } = useAdminAuth();

  const usersQuery = useQuery({
    queryKey: ['platform-admin', 'users'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listAdminUsers(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load platform admin users');
      }
      return (response.data as Array<{ id: string; email: string; role: string; isActive?: boolean }>) || [];
    },
  });

  const summary = useMemo(() => {
    const ready = endpointRows.filter((row) => row.status === 'available').length;
    const pending = endpointRows.length - ready;
    return {
      ready,
      pending,
      total: endpointRows.length,
    };
  }, []);

  if (!sessionToken) {
    return (
      <div>
        <PlatformModuleHeader
          title="Platform Admins"
          description="Control platform operator identities, role scopes, and active sessions."
        />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Sign in as platform admin to access this module.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PlatformModuleHeader
        title="Platform Admins"
        description="Control platform operator identities, role scopes, and active sessions."
      />

      <div className="grid gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Endpoint Coverage</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ready</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">{summary.ready}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">{summary.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Current Operator</CardTitle></CardHeader>
          <CardContent className="text-sm font-medium">{adminUser?.email || 'platform admin'}</CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Readiness Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpointRows.map((row) => (
                  <TableRow key={row.endpoint}>
                    <TableCell className="font-mono text-xs">{row.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'available' ? 'default' : 'secondary'}>
                        {row.status === 'available' ? 'Available' : 'Pending Backend'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading platform admins...</p>}
            {usersQuery.isError && (
              <Alert>
                <AlertTitle>User Lifecycle API Required</AlertTitle>
                <AlertDescription>
                  {(usersQuery.error as Error).message}. This module will automatically start listing users once backend user lifecycle endpoints are implemented.
                </AlertDescription>
              </Alert>
            )}
            {usersQuery.data && usersQuery.data.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive === false ? 'secondary' : 'default'}>
                          {user.isActive === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';

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

  const users = useMemo(() => usersQuery.data || [], [usersQuery.data]);

  const summary = useMemo(() => {
    const active = users.filter((user) => user.isActive !== false).length;
    const inactive = Math.max(users.length - active, 0);
    return {
      total: users.length,
      active,
      inactive,
    };
  }, [users]);

  const apiStatusLabel = usersQuery.isError
    ? 'Unavailable'
    : usersQuery.isSuccess
      ? 'Connected'
      : 'Checking';

  if (!sessionToken) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      <PlatformModuleHeader
        title="Platform Admins"
        description="Control platform operator identities, role scopes, and active sessions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Platform Admin Users</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">{summary.active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Inactive</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">{summary.inactive}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Admin API Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={usersQuery.isError ? 'secondary' : 'default'}>{apiStatusLabel}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Platform Admin Users</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Signed in as {adminUser?.email || 'platform admin'}</span>
            <Button size="sm" variant="outline" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}>
              {usersQuery.isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading platform admins...</p>}
          {usersQuery.isError && (
            <Alert>
              <AlertTitle>Unable to load platform admins</AlertTitle>
              <AlertDescription>{(usersQuery.error as Error).message}</AlertDescription>
            </Alert>
          )}
          {users.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
          {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
            <p className="text-sm text-muted-foreground">No platform admin users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

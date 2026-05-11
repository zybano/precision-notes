import {useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import AdminFormField from '@/components/admin/AdminFormField';
import {AdminMetricTile, AdminSectionPanel, AdminTableShell} from '@/components/admin/AdminSurface';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import {toast} from 'sonner';
import {ShieldCheck, UserCheck, UserX, Wifi} from 'lucide-react';

export default function PlatformAdminsPage() {
  const { sessionToken, adminUser } = useAdminAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
  });

  const usersQuery = useQuery({
    queryKey: ['platform-admin', 'users'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listAdminUsers(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load platform admin users');
      }
      return (
        response.data as Array<{ id: string; username?: string; email: string; fullName?: string; isActive?: boolean }>
      ) || [];
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.createAdminUser(sessionToken as string, {
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        fullName: createForm.fullName.trim() || undefined,
        password: createForm.password,
        isActive: true,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to create platform admin');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Platform admin created');
      setCreateDialogOpen(false);
      setCreateForm({ username: '', email: '', fullName: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const users = useMemo(() => usersQuery.data || [], [usersQuery.data]);

  const formError = useMemo(() => {
    if (!createForm.username.trim()) return 'Username is required.';
    if (!createForm.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) return 'Enter a valid email address.';
    if (!createForm.password || createForm.password.length < 8) return 'Password must be at least 8 characters.';
    return '';
  }, [createForm.email, createForm.password, createForm.username]);

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricTile label="Platform Admin Users" value={summary.total} helper="Total operators" icon={<ShieldCheck className="h-4 w-4" />} tone="info" />
        <AdminMetricTile label="Active" value={summary.active} helper="Can access console" icon={<UserCheck className="h-4 w-4" />} tone="success" />
        <AdminMetricTile label="Inactive" value={summary.inactive} helper="Disabled accounts" icon={<UserX className="h-4 w-4" />} tone="warning" />
        <AdminMetricTile label="Admin API Status" value={apiStatusLabel} helper="Identity endpoint" icon={<Wifi className="h-4 w-4" />} tone={usersQuery.isError ? 'warning' : 'success'} />
      </div>

      <AdminSectionPanel
        title="Platform Admin Users"
        description={`Signed in as ${adminUser?.email || 'platform admin'}`}
        actions={(
          <div className="flex items-center gap-3">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Invite Admin</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Invite Platform Admin</DialogTitle>
                  <DialogDescription>Create a new platform admin account.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-1">
                  <AdminFormField label="Username" htmlFor="create-admin-username">
                    <Input
                      id="create-admin-username"
                      value={createForm.username}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="jdoe"
                    />
                  </AdminFormField>
                  <AdminFormField label="Email" htmlFor="create-admin-email">
                    <Input
                      id="create-admin-email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="jdoe@precisionnote.ai"
                    />
                  </AdminFormField>
                  <AdminFormField label="Full Name (optional)" htmlFor="create-admin-fullname">
                    <Input
                      id="create-admin-fullname"
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Jane Doe"
                    />
                  </AdminFormField>
                  <AdminFormField label="Temporary Password" htmlFor="create-admin-password">
                    <Input
                      id="create-admin-password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="At least 8 characters"
                    />
                  </AdminFormField>
                  {formError && <p className="text-xs text-destructive">{formError}</p>}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => createAdminMutation.mutate()} disabled={createAdminMutation.isPending || Boolean(formError)}>
                    {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}>
              {usersQuery.isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        )}
      >
          {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading platform admins...</p>}
          {usersQuery.isError && (
            <Alert>
              <AlertTitle>Unable to load platform admins</AlertTitle>
              <AlertDescription>{(usersQuery.error as Error).message}</AlertDescription>
            </Alert>
          )}
          {users.length > 0 && (
            <AdminTableShell>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.fullName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive === false ? 'secondary' : 'default'}>
                        {user.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </AdminTableShell>
          )}
          {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
            <p className="text-sm text-muted-foreground">No platform admin users found.</p>
          )}
      </AdminSectionPanel>
    </div>
  );
}

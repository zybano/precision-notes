import {useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
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
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import {toast} from 'sonner';

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
          )}
          {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
            <p className="text-sm text-muted-foreground">No platform admin users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

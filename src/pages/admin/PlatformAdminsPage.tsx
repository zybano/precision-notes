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
import {AdminMetricStrip, AdminSectionPanel, AdminTableShell} from '@/components/admin/AdminSurface';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import {toast} from 'sonner';
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger} from '@/components/ui/sheet';
import type {PlatformAdminSession} from '@/types/platformAdmin';

type Operator = {id: string; username?: string; email: string; fullName?: string; isActive?: boolean};
export default function PlatformAdminsPage() {
  const { sessionToken, adminUser } = useAdminAuth();
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState<Operator | null>(null);
  const [editForm, setEditForm] = useState({email: '', fullName: ''});
  const [passwordUser, setPasswordUser] = useState<Operator | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [disableUser, setDisableUser] = useState<Operator | null>(null);
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

  const sessionsQuery = useQuery({queryKey: ['platform-admin', 'sessions'], enabled: Boolean(sessionToken), queryFn: async () => {
    const response = await adminApiService.listAdminSessions(sessionToken!);
    if (!response.success) throw new Error(response.error || 'Unable to load sessions'); return (response.data || []) as PlatformAdminSession[];
  }});
  const operatorMutation = useMutation({mutationFn: async ({action, user}: {action: 'edit' | 'disable' | 'enable' | 'password'; user: Operator}) => {
    const response = action === 'disable' ? await adminApiService.deleteAdminUser(sessionToken!, user.id)
      : action === 'password' ? await adminApiService.resetAdminUserPassword(sessionToken!, user.id, newPassword)
      : await adminApiService.updateAdminUser(sessionToken!, user.id, action === 'enable' ? {isActive: true} : {email: editForm.email.trim(), fullName: editForm.fullName.trim()});
    if (!response.success) throw new Error(response.error || 'Unable to update operator');
  }, onSuccess: () => {setEditUser(null); setPasswordUser(null); setDisableUser(null); setNewPassword(''); void queryClient.invalidateQueries({queryKey: ['platform-admin', 'users']}); void queryClient.invalidateQueries({queryKey: ['platform-admin', 'sessions']}); toast.success('Operator updated');}, onError: (error: Error) => toast.error(error.message)});
  const revokeMutation = useMutation({mutationFn: async (id: string) => {
    const response = await adminApiService.revokeAdminSession(sessionToken!, id); if (!response.success) throw new Error(response.error || 'Unable to revoke session');
  }, onSuccess: () => {void queryClient.invalidateQueries({queryKey: ['platform-admin', 'sessions']}); toast.success('Session revoked');}, onError: (error: Error) => toast.error(error.message)});

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

  if (!sessionToken) {
    return (
      <div className="space-y-6">
        <PlatformModuleHeader
          title="Platform Admins"
          description="Operators and sessions."
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
        description="Operators and sessions."
      />

      <AdminMetricStrip items={[{label: 'Operators', value: usersQuery.isSuccess ? summary.total : '—'}, {label: 'Active', value: usersQuery.isSuccess ? summary.active : '—', success: true}, {label: 'Disabled', value: usersQuery.isSuccess ? summary.inactive : '—'}, {label: 'Active sessions', value: sessionsQuery.isSuccess ? sessionsQuery.data.filter(session => !session.expired).length : '—'}]} />

      <AdminSectionPanel
        title="Platform Admin Users"
        description={`Signed in as ${adminUser?.email || 'platform admin'}`}
        actions={(
          <div className="flex items-center gap-3">
            <Sheet modal={false} open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <SheetTrigger asChild>
                <Button size="sm">Create admin</Button>
              </SheetTrigger>
              <SheetContent className="admin-workspace top-16 h-[calc(100dvh-4rem)] w-full overflow-y-auto sm:max-w-[470px]">
                <SheetHeader>
                  <SheetTitle>Create platform admin</SheetTitle>
                  <SheetDescription>Create a new platform admin account.</SheetDescription>
                </SheetHeader>

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
              </SheetContent>
            </Sheet>
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
                  <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => {setEditUser(user); setEditForm({email: user.email, fullName: user.fullName || ''});}}>Edit</Button><Button variant="ghost" size="sm" disabled={user.id === adminUser?.id} onClick={() => {setPasswordUser(user); setNewPassword('');}}>Reset password</Button><Button variant="ghost" size="sm" disabled={user.id === adminUser?.id || operatorMutation.isPending} onClick={() => user.isActive === false ? operatorMutation.mutate({action: 'enable', user}) : setDisableUser(user)}>{user.isActive === false ? 'Enable' : 'Disable'}</Button></div></TableCell>
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
      <AdminSectionPanel title="Sessions" description="Review and revoke platform operator sessions.">
        {sessionsQuery.isError && <p role="alert" className="text-sm text-destructive">{sessionsQuery.error.message}</p>}
        <AdminTableShell><Table><TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>
          {sessionsQuery.isLoading && <TableRow><TableCell colSpan={4}>Loading sessions…</TableCell></TableRow>}
          {sessionsQuery.isSuccess && !sessionsQuery.data.length && <TableRow><TableCell colSpan={4} className="text-slate-500">No sessions found.</TableCell></TableRow>}
          {sessionsQuery.data?.map(session => <TableRow key={session.sessionId}><TableCell>{session.adminUsername || session.adminEmail || '—'}</TableCell><TableCell>{session.createdAt ? new Date(session.createdAt).toLocaleString() : '—'}</TableCell><TableCell>{session.expired ? 'Expired' : 'Active'}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" disabled={session.expired || revokeMutation.isPending} onClick={() => revokeMutation.mutate(session.sessionId)}>Revoke</Button></TableCell></TableRow>)}
        </TableBody></Table></AdminTableShell>
      </AdminSectionPanel>
      <p className="text-sm text-slate-500">Use Profile to change your own password.</p>
      <Dialog open={Boolean(editUser)} onOpenChange={open => !open && setEditUser(null)}><DialogContent><DialogHeader><DialogTitle>Edit operator</DialogTitle><DialogDescription>{editUser?.username}</DialogDescription></DialogHeader><AdminFormField label="Email" htmlFor="operator-email"><Input id="operator-email" type="email" value={editForm.email} onChange={event => setEditForm({...editForm, email: event.target.value})} /></AdminFormField><AdminFormField label="Full name" htmlFor="operator-name"><Input id="operator-name" value={editForm.fullName} onChange={event => setEditForm({...editForm, fullName: event.target.value})} /></AdminFormField><DialogFooter><Button disabled={operatorMutation.isPending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())} onClick={() => editUser && operatorMutation.mutate({action: 'edit', user: editUser})}>Save operator</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(passwordUser)} onOpenChange={open => !open && setPasswordUser(null)}><DialogContent><DialogHeader><DialogTitle>Reset password</DialogTitle><DialogDescription>Set a new password for {passwordUser?.username}. Other sessions will be revoked.</DialogDescription></DialogHeader><AdminFormField label="New password" htmlFor="operator-password"><Input id="operator-password" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></AdminFormField><DialogFooter><Button disabled={operatorMutation.isPending || newPassword.length < 8} onClick={() => passwordUser && operatorMutation.mutate({action: 'password', user: passwordUser})}>Reset password</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(disableUser)} onOpenChange={open => !open && setDisableUser(null)}><DialogContent><DialogHeader><DialogTitle>Disable operator?</DialogTitle><DialogDescription>{disableUser?.username} will lose platform access. You can enable this operator again.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDisableUser(null)}>Cancel</Button><Button disabled={operatorMutation.isPending} onClick={() => disableUser && operatorMutation.mutate({action: 'disable', user: disableUser})}>Disable operator</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

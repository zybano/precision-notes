import {useState} from 'react';
import {Outlet, useNavigate} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {LogOut, Menu, ShieldCheck, UserCircle} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import type {PlatformAdminSession} from '@/types/platformAdmin';
import PlatformSidebar from '@/components/admin/PlatformSidebar';
import AdminFormField from '@/components/admin/AdminFormField';
import {AdminTableShell} from '@/components/admin/AdminSurface';
import {toast} from 'sonner';

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function PlatformAdminLayout() {
  const { sessionToken, signOut, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSignOut = async () => {
    await signOut(sessionToken || '');
    navigate('/admin/login');
  };

  const sessionsQuery = useQuery({
    queryKey: ['platform-admin', 'sessions'],
    enabled: Boolean(sessionToken && profileOpen),
    queryFn: async () => {
      const response = await adminApiService.listAdminSessions(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load sessions');
      return (response.data as PlatformAdminSession[]) || [];
    },
  });

  const changePasswordError = !passwordForm.currentPassword
    ? 'Current password is required.'
    : passwordForm.newPassword.length < 8
      ? 'New password must be at least 8 characters.'
      : passwordForm.newPassword !== passwordForm.confirmPassword
        ? 'Passwords do not match.'
        : '';

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.changeAdminPassword(
        sessionToken as string,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      if (!response.success) throw new Error(response.error || 'Failed to change password');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed');
      setPasswordForm({currentPassword: '', newPassword: '', confirmPassword: ''});
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'sessions']});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await adminApiService.revokeAdminSession(sessionToken as string, sessionId);
      if (!response.success) throw new Error(response.error || 'Failed to revoke session');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Session revoked');
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'sessions']});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <PlatformSidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-7">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden" aria-label="Open navigation">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <PlatformSidebar mobile />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Control Center</p>
            <p className="truncate text-sm text-slate-700">Signed in as {adminUser?.email || 'platform admin'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)} className="shrink-0 px-3">
            <UserCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0 px-3">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </header>
        <main className="p-4 md:p-7">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Admin Profile</SheetTitle>
            <SheetDescription>Manage your platform admin password and active sessions.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-950">{adminUser?.name || 'Platform Admin'}</p>
                  <p className="truncate text-sm text-slate-500">{adminUser?.email || '-'}</p>
                  <Badge className="mt-2" variant="secondary">{adminUser?.role || 'platform_admin'}</Badge>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Change Password</h2>
                <p className="text-sm text-slate-500">Changing your password revokes other active sessions.</p>
              </div>
              <div className="grid gap-3">
                <AdminFormField label="Current Password" htmlFor="current-password">
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({...prev, currentPassword: e.target.value}))}
                  />
                </AdminFormField>
                <AdminFormField label="New Password" htmlFor="new-password">
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({...prev, newPassword: e.target.value}))}
                  />
                </AdminFormField>
                <AdminFormField label="Confirm Password" htmlFor="confirm-password" errorText={changePasswordError || undefined}>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({...prev, confirmPassword: e.target.value}))}
                  />
                </AdminFormField>
              </div>
              <Button
                onClick={() => changePasswordMutation.mutate()}
                disabled={Boolean(changePasswordError) || changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Active Sessions</h2>
                  <p className="text-sm text-slate-500">Review and revoke platform admin sessions.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => sessionsQuery.refetch()} disabled={sessionsQuery.isFetching}>
                  {sessionsQuery.isFetching ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
              <AdminTableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsQuery.isLoading && <TableRow><TableCell colSpan={4}>Loading sessions...</TableCell></TableRow>}
                    {sessionsQuery.isError && <TableRow><TableCell colSpan={4} className="text-destructive">{(sessionsQuery.error as Error).message}</TableCell></TableRow>}
                    {!sessionsQuery.isLoading && !sessionsQuery.isError && (sessionsQuery.data || []).length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-muted-foreground">No active sessions found.</TableCell></TableRow>
                    )}
                    {(sessionsQuery.data || []).map((session) => (
                      <TableRow key={session.sessionId}>
                        <TableCell>
                          <div className="font-medium">{session.adminUsername || session.adminEmail || '-'}</div>
                          <div className="max-w-[13rem] truncate text-xs text-slate-500">{session.ipAddress || session.userAgent || '-'}</div>
                        </TableCell>
                        <TableCell>{formatDate(session.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={session.expired ? 'secondary' : 'default'}>{session.expired ? 'Expired' : 'Active'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeSessionMutation.mutate(session.sessionId)}
                            disabled={revokeSessionMutation.isPending}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableShell>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

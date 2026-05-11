import {Outlet, useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {LogOut} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import PlatformSidebar from '@/components/admin/PlatformSidebar';

export default function PlatformAdminLayout() {
  const { sessionToken, signOut, adminUser } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(sessionToken || '');
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PlatformSidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-7">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Control Center</p>
            <p className="truncate text-sm text-slate-700">Signed in as {adminUser?.email || 'platform admin'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0 px-3">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </header>
        <main className="p-4 md:p-7">
          <div className="mx-auto w-full max-w-[1380px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

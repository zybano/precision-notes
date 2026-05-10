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
    <div className="min-h-screen bg-background flex">
      <PlatformSidebar />
      <div className="flex-1 min-w-0">
        <header className="h-16 border-b bg-background px-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Control Center</p>
            <p className="text-sm">Signed in as {adminUser?.email || 'platform admin'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

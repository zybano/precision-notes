import {NavLink} from 'react-router-dom';
import {BarChart3, Building2, FlaskConical, LayoutDashboard, Settings, ShieldCheck, Wallet} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';

const navItems = [
  { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard, permission: null },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2, permission: 'organizations' },
  { to: '/admin/plans-billing', label: 'Plans and Billing', icon: Wallet, permission: 'billing' },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'analytics' },
  { to: '/admin/sandbox', label: 'Sandbox', icon: FlaskConical, permission: 'sandbox' },
  { to: '/admin/platform-admins', label: 'Platform Admins', icon: ShieldCheck, permission: 'platform_admins' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings' },
];

export default function PlatformSidebar() {
  const { hasPermission } = useAdminAuth();

  const visibleItems = navItems.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <aside className="hidden md:block w-72 shrink-0 border-r bg-white">
      <div className="h-16 px-6 flex items-center border-b">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Precision Notes</p>
          <h1 className="text-lg font-semibold">Platform Admin</h1>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

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
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Precision Notes</p>
          <h1 className="text-lg font-semibold text-slate-950">Platform Admin</h1>
        </div>
      </div>

      <nav className="space-y-1 p-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-slate-950 text-white font-medium shadow-[0_6px_18px_rgba(15,23,42,0.12)]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
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

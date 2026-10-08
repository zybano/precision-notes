import {NavLink} from 'react-router-dom';
import {BarChart3, UsersRound, Box, House, Settings, CreditCard} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {cn} from '@/lib/utils';

const navItems = [
  { to: '/admin/overview', label: 'Overview', icon: House, permission: null },
  { to: '/admin/organizations', label: 'Organizations', icon: UsersRound, permission: 'organizations' },
  { to: '/admin/plans-billing', label: 'Plans and Billing', icon: CreditCard, permission: 'billing' },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'analytics' },
  { to: '/admin/sandbox', label: 'Sandbox', icon: Box, permission: 'sandbox' },
  { to: '/admin/platform-admins', label: 'Platform Admins', icon: UsersRound, permission: 'platform_admins' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings' },
];

export default function PlatformSidebar({mobile = false, className, onNavigate}: {mobile?: boolean; className?: string; onNavigate?: () => void}) {
  const { hasPermission } = useAdminAuth();

  const visibleItems = navItems.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <aside className={cn(mobile ? 'block w-full bg-white' : 'hidden w-[236px] shrink-0 border-r border-slate-200 bg-white md:block', className)}>
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div>
          <p className="text-[22px] font-bold tracking-tight text-[#14213d]">Precision Notes</p>
          <p className="text-sm text-slate-500">Platform Admin</p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-6">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

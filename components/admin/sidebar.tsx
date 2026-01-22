'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Wallet,
  Users,
  Shield,
  LogOut,
  Medal,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Trophy,
  Settings,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: string;
};

type AdminSidebarProps = {
  userRole: string;
  username: string;
  onLogout: () => void;
};

export default function AdminSidebar({ userRole, username, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['super_admin', 'admin', 'finance_admin', 'inventory_admin'],
    },
    {
      label: 'Registrations',
      href: '/admin/registrations',
      icon: <Users className="h-5 w-5" />,
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Inventory',
      href: '/admin/inventory',
      icon: <Package className="h-5 w-5" />,
      roles: ['super_admin', 'inventory_admin'],
    },
    {
      label: 'Finance',
      href: '/admin/finance',
      icon: <Wallet className="h-5 w-5" />,
      roles: ['super_admin', 'finance_admin'],
    },
    {
      label: 'Sport Groups',
      href: '/admin/super',
      icon: <Shield className="h-5 w-5" />,
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'HOC Scheduling',
      href: '/admin/hoc',
      icon: <Trophy className="h-5 w-5" />,
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Email Composer',
      href: '/admin/email',
      icon: <Mail className="h-5 w-5" />,
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: ['super_admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      super_admin: { label: 'Super Admin', color: 'from-purple-500 to-pink-500' },
      admin: { label: 'Admin', color: 'from-blue-500 to-indigo-500' },
      finance_admin: { label: 'Finance', color: 'from-emerald-500 to-teal-500' },
      inventory_admin: { label: 'Inventory', color: 'from-amber-500 to-orange-500' },
    };
    return badges[role] || { label: 'Staff', color: 'from-slate-400 to-slate-500' };
  };

  const roleBadge = getRoleBadge(userRole);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b border-slate-700/50 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Medal className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-white text-lg truncate">Mini Olympics</h1>
              <p className="text-xs text-slate-400 truncate">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-slate-700/50 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-sm truncate">{username}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto px-2 py-0.5 bg-amber-500 text-amber-900 text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t border-slate-700/50 ${collapsed ? 'px-2' : ''}`}>
        <Button
          onClick={onLogout}
          variant="ghost"
          className={`w-full text-slate-300 hover:text-white hover:bg-red-500/20 justify-start gap-3 ${collapsed ? 'px-2 justify-center' : ''}`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>

      {/* Collapse Toggle - Desktop */}
      <div className="hidden lg:block p-3 border-t border-slate-700/50">
        <Button
          onClick={() => setCollapsed(!collapsed)}
          variant="ghost"
          className="w-full text-slate-400 hover:text-white hover:bg-slate-700/50 justify-center"
          size="sm"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-xl shadow-lg text-white"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-40 transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

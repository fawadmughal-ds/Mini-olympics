'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/sidebar';

// Define which pages each role can access
const rolePermissions: Record<string, string[]> = {
  super_admin: ['/admin/dashboard', '/admin/registrations', '/admin/inventory', '/admin/finance', '/admin/super', '/admin/hoc', '/admin/email', '/admin/settings', '/admin/esports'],
  registration_admin: ['/admin/registrations'],
  inventory_admin: ['/admin/inventory'],
  hoc_admin: ['/admin/super', '/admin/hoc'],
};

// Get the default redirect page for each role
const roleDefaultPage: Record<string, string> = {
  super_admin: '/admin/dashboard',
  registration_admin: '/admin/registrations',
  inventory_admin: '/admin/inventory',
  hoc_admin: '/admin/hoc',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Skip layout for login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    fetch('/api/admin/verify')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const role = data.role || 'super_admin';
          setUserRole(role);
          setUsername(data.username || 'Admin');
          
          // Check if user has access to current page
          const allowedPages = rolePermissions[role] || [];
          const hasAccess = allowedPages.some(page => pathname.startsWith(page));
          
          if (!hasAccess) {
            // Redirect to their default page
            const defaultPage = roleDefaultPage[role] || '/admin/dashboard';
            router.push(defaultPage);
            setAccessDenied(true);
          } else {
            setAuthenticated(true);
          }
        } else {
          router.push('/admin/login');
        }
      })
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false));
  }, [router, isLoginPage, pathname]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Login page doesn't use sidebar layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-400/30 rounded-full animate-pulse"></div>
            <div className="w-20 h-20 border-4 border-t-blue-400 rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="text-blue-200 mt-6 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || accessDenied) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <AdminSidebar userRole={userRole} username={username} onLogout={handleLogout} />
      <main className="flex-1 lg:ml-0 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

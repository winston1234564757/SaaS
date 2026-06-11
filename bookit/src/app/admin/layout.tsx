import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminThemeApplier } from '@/components/admin/AdminThemeApplier';
import {
  LayoutDashboard,
  Users,
  GitMerge,
  ShieldCheck,
  MessageSquare,
  Activity,
  LogOut,
  ClipboardList,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  let user = null;
  try {
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
  } catch {
    user = null;
  }

  if (!user) redirect('/login');

  // Verify administrative role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const menuItems = [
    { name: 'Огляд', href: '/admin', icon: LayoutDashboard },
    { name: 'Майстри', href: '/admin/masters', icon: Users },
    { name: 'Альянси', href: '/admin/alliances', icon: GitMerge },
    { name: 'Модерація', href: '/admin/moderation', icon: ShieldCheck },
    { name: 'Підтримка чат', href: '/admin/support', icon: MessageSquare },
    { name: 'Системні логи', href: '/admin/logs', icon: Activity },
    { name: 'Бета-заявки', href: '/admin/beta-requests', icon: ClipboardList },
  ];

  return (
    <div className="min-h-dvh flex bg-[#EFF2FF] text-slate-900 font-sans selection:bg-indigo-150 relative overflow-hidden">
      <AdminThemeApplier />

      {/* Left Sidebar */}
      <aside className="w-[280px] shrink-0 border-r border-slate-200/60 bg-white/70 backdrop-blur-md flex flex-col justify-between p-6 z-10 sticky top-0 h-dvh">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <span className="font-serif text-2xl font-semibold tracking-wider text-slate-950">BookIT</span>
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-50 uppercase tracking-wide">
              Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100/50 active:scale-[0.98] transition cursor-pointer"
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3.5 py-3 rounded-full text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Кабінет майстра
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col p-6 lg:p-8 overflow-y-auto h-dvh z-10 relative">
        {children}
      </main>
    </div>
  );
}

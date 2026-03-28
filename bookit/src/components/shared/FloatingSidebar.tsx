'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Scissors, Users, BarChart2, Settings, MessageSquare, GalleryHorizontalEnd, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tooltip } from '@/components/ui/Tooltip';
import { useMasterContext } from '@/lib/supabase/context';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';

const navItems = [
  { href: '/dashboard',           icon: LayoutDashboard,       label: 'Головна',      hint: 'Огляд дня та статистика' },
  { href: '/dashboard/bookings',  icon: CalendarDays,          label: 'Записи',       hint: 'Всі записи та календар' },
  { href: '/dashboard/services',  icon: Scissors,              label: 'Послуги',      hint: 'Послуги та товари' },
  { href: '/dashboard/clients',   icon: Users,                 label: 'Клієнти',      hint: 'База клієнтів та CRM' },
  { href: '/dashboard/portfolio', icon: GalleryHorizontalEnd,  label: 'Портфоліо',    hint: 'Фото ваших робіт для клієнтів' },
  { href: '/dashboard/analytics', icon: BarChart2,             label: 'Аналітика',    hint: 'Звіти, виручка, тренди' },
  { href: '/dashboard/reviews',   icon: MessageSquare,         label: 'Відгуки',      hint: 'Керування відгуками клієнтів' },
  { href: '/dashboard/more',      icon: MoreHorizontal,        label: 'Ще',           hint: 'Флеш, Ціни, Лояльність, Студія та інше' },
  { href: '/dashboard/settings',  icon: Settings,              label: 'Налаштування', hint: 'Профіль, тема, інтеграції' },
];

export function FloatingSidebar() {
  const pathname = usePathname();
  const { profile, masterProfile } = useMasterContext();
  const { todayPending } = useDashboardStats();
  const displayName = profile?.full_name ?? 'Завантаження...';
  const tier = masterProfile?.subscription_tier ?? 'starter';
  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'studio' ? 'Studio' : 'Starter';
  const avatarEmoji = masterProfile?.avatar_emoji ?? '💅';
  const avatarUrl   = profile?.avatar_url ?? null;

  return (
    <div className="floating-sidebar flex flex-col p-3">
      {/* Logo */}
      <Link href="/" className="px-4 py-4 mb-2">
        <span className="heading-serif text-xl text-[#2C1A14]">
          Bookit<span className="text-[#789A99]">.</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label, hint }) => {
          const isActive =
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          const showBadge = href === '/dashboard/bookings' && todayPending > 0;
          return (
            <Tooltip key={href} content={
              <div>
                <p className="text-[11px] font-semibold text-[#2C1A14]">{label}</p>
                <p className="text-[11px] text-[#6B5750]">{hint}</p>
              </div>
            } position="right" delay={500}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 w-full',
                  isActive
                    ? 'bg-[#789A99]/12 text-[#5C7E7D]'
                    : 'text-[#6B5750] hover:bg-white/55 hover:text-[#2C1A14]'
                )}
              >
                <div className="relative shrink-0">
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#D4935A] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {todayPending > 9 ? '9+' : todayPending}
                    </span>
                  )}
                </div>
                {label}
                {showBadge && (
                  <span className="ml-auto text-[10px] font-semibold text-[#D4935A] bg-[#D4935A]/10 px-1.5 py-0.5 rounded-full">
                    {todayPending} нові
                  </span>
                )}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="pt-3 border-t border-[#E8D5CF]/70">
        <Tooltip content={
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-semibold text-[#2C1A14]">{displayName}</p>
            <p className="text-[11px] text-[#6B5750]">Тариф: {tierLabel}</p>
            <p className="text-[10px] text-[#789A99]">Перейти до налаштувань профілю →</p>
          </div>
        } position="right" delay={400}>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/55 transition-colors w-full">
            <div
              className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-sm"
              style={{ background: 'rgba(255,210,194,0.6)' }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                avatarEmoji
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2C1A14] truncate">{displayName}</p>
              <p className="text-xs text-[#A8928D]">{tierLabel}</p>
            </div>
          </Link>
        </Tooltip>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/my/bookings', icon: CalendarDays, label: 'Записи'   },
  { href: '/my/masters',  icon: Users,        label: 'Майстри'  },
  { href: '/my/loyalty',  icon: Gift,         label: 'Бонуси'   },
  { href: '/my/profile',  icon: User,         label: 'Профіль'  },
];

export function MyBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-2">
      <div className="bento-card flex items-center justify-around py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-0 flex-1 transition-all duration-150',
                isActive ? 'text-[#789A99]' : 'text-[#A8928D]'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

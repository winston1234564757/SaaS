'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const LINKS = [
  { href: '/dashboard/bookings',  label: 'Записи'       },
  { href: '/dashboard/clients',   label: 'Клієнти'      },
  { href: '/dashboard/services',  label: 'Послуги'      },
  { href: '/dashboard/analytics', label: 'Аналітика'    },
  { href: '/dashboard/flash',     label: 'Flash'        },
  { href: '/dashboard/products',  label: 'Магазин'      },
  { href: '/dashboard/reviews',   label: 'Відгуки'      },
  { href: '/dashboard/portfolio', label: 'Портфоліо'    },
  { href: '/dashboard/marketing', label: 'Маркетинг'    },
  { href: '/dashboard/settings',  label: 'Налаштування' },
];

export function QuickActionsWidget() {
  const pathname = usePathname();

  return (
    <div>
      <p
        className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3 px-1"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Навігація
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {LINKS.map((link, i) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28, delay: i * 0.035 }}
            >
              <Link
                href={link.href}
                className="flex items-center justify-center px-3 py-2.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 text-center"
                style={{
                  background:  isActive ? 'var(--btn-primary-bg)' : 'var(--surface)',
                  border:      isActive ? 'none' : '0.5px solid var(--border-strong)',
                  color:       isActive ? 'var(--accent-on)' : 'var(--text-secondary)',
                  boxShadow:   isActive ? 'var(--btn-primary-shadow)' : 'none',
                }}
              >
                {link.label}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import Image from 'next/image';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const NOTIFICATIONS = [
  {
    channel: 'Telegram',
    sender: 'Bookit',
    text: 'РќРѕРІРёР№ Р·Р°РїРёСЃ! РђРЅСЏ РљРѕРІР°Р»РµРЅРєРѕ В· РњР°РЅС–РєСЋСЂ В· Р—Р°РІС‚СЂР°, 10:00 В· в‚ґ650',
    time: '09:47',
    icon: (
      <Image src="/landing/telegram.png" width={36} height={36} alt="" />
    ),
    accent: '#229ED9',
  },
  {
    channel: 'Push',
    sender: 'Bookit',
    text: 'РќР°РіР°РґСѓРІР°РЅРЅСЏ: Р·Р°РїРёСЃ Сѓ РњР°СЂРёРЅРё С‡РµСЂРµР· 2 РіРѕРґРёРЅРё. РџРµРґРёРєСЋСЂ В· 13:00',
    time: '10:58',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="10" fill="#4338CA" />
        <path d="M18 7a1.5 1.5 0 011.5 1.5v1.6A7.5 7.5 0 0125.5 17v4.5l2.25 2.25A.75.75 0 0127 25H9a.75.75 0 01-.53-1.28L10.5 21.5V17a7.5 7.5 0 016-7.4V8.5A1.5 1.5 0 0118 7zm0 24a3 3 0 01-3-3h6a3 3 0 01-3 3z" fill="white" />
      </svg>
    ),
    accent: '#4338CA',
  },
  {
    channel: 'SMS',
    sender: '+38 (044) 000-0000',
    text: 'Bookit: РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ Р·Р°РїРёСЃСѓ РЅР° 15:30. Р’С–РґРїРѕРІС–СЃС‚Рё CANCEL РґР»СЏ СЃРєР°СЃСѓРІР°РЅРЅСЏ.',
    time: '14:22',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="10" fill="#64748B" />
        <path d="M6 8h24a1.5 1.5 0 011.5 1.5v13.5A1.5 1.5 0 0130 24.5H10.5L4.5 30V9.5A1.5 1.5 0 016 8z" fill="white" />
      </svg>
    ),
    accent: '#64748B',
  },
];

const CHANNELS = [
  { label: 'Telegram Bot', sub: 'Р—Р°РїРёСЃРё Р№ СЃРєР°СЃСѓРІР°РЅРЅСЏ РІ СЂРµР°Р»СЊРЅРѕРјСѓ С‡Р°СЃС–' },
  { label: 'Push-СЃРїРѕРІС–С‰РµРЅРЅСЏ', sub: 'iOS С‚Р° Android Р±РµР· РґРѕРґР°С‚РєР°' },
  { label: 'SMS-СЂРµР·РµСЂРІ', sub: 'TurboSMS РґР»СЏ РєСЂРёС‚РёС‡РЅРёС… РїРѕРґС–Р№' },
  { label: 'QR-РєРѕРґ', sub: 'Р”Р»СЏ Instagram, TikTok, СЃС‚С–РЅРё СЃС‚СѓРґС–С—' },
];

export function LandingIntegrations() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-surface)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left: header */}
          <motion.div style={{ y: headingY }}>
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ ...spring, delay: 0.05 }}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
              style={{ color: 'var(--l-indigo)' }}
            >
              РЎРїРѕРІС–С‰РµРЅРЅСЏ
            </motion.span>

            <LandingSplitHeading
              text={"РљР»С–С”РЅС‚ Р·Р°РІР¶РґРё\nР·РЅР°С”, РґРµ С– РєРѕР»Рё."}
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
              style={{ fontSize: 'clamp(2.6rem,5vw,4.4rem)', color: 'var(--l-ink)' }}
              stagger={70}
              lineDelay={200}
            />

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.28 }}
              className="mt-6 text-base leading-relaxed max-w-sm"
              style={{ color: 'var(--l-muted)' }}
            >
              Bookit Р°РІС‚РѕРјР°С‚РёС‡РЅРѕ РѕР±РёСЂР°С” РєР°РЅР°Р» РґР»СЏ РєРѕР¶РЅРѕРіРѕ СЃРїРѕРІС–С‰РµРЅРЅСЏ вЂ” Telegram, Push Р°Р±Рѕ SMS. Р–РѕРґРЅРѕРіРѕ РїСЂРѕРїСѓС‰РµРЅРѕРіРѕ Р·Р°РїРёСЃСѓ.
            </motion.p>

            <div className="mt-10 flex flex-col gap-0" style={{ borderTop: '1px solid var(--l-border)' }}>
              {CHANNELS.map((ch, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, ease: easeOut, delay: 0.36 + i * 0.07 }}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: '1px solid var(--l-border)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--l-ink)' }}>
                    {ch.label}
                  </span>
                  <span className="text-xs text-right max-w-[180px]" style={{ color: 'var(--l-muted)' }}>
                    {ch.sub}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: notification mockups */}
          <div className="flex flex-col gap-4">
            {NOTIFICATIONS.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.9, ease: easeOut, delay: 0.15 + i * 0.14 }}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{
                  background: 'var(--l-bg)',
                  border: '1px solid var(--l-border)',
                }}
              >
                <div className="flex-shrink-0 mt-0.5">{n.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: 'var(--l-ink)' }}>
                      {n.sender}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--l-muted)' }}>
                      {n.time}
                    </span>
                  </div>
                  <p className="text-sm leading-snug" style={{ color: 'var(--l-muted)' }}>
                    {n.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

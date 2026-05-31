'use client';

import { Star, BadgeCheck, Clock, Calendar } from 'lucide-react';
import { moodThemes } from '@/lib/constants/themes';
import { serviceCategories } from '@/lib/constants/categories';

interface PreviewService {
  name: string;
  price: number;
  duration: number;
}

interface PublicPagePreviewProps {
  name: string;
  avatarUrl?: string;
  categoryIds: string[];
  services: PreviewService[];
  themeKey?: keyof typeof moodThemes;
}

export function PublicPagePreview({
  name,
  avatarUrl,
  categoryIds,
  services,
  themeKey = 'default',
}: PublicPagePreviewProps) {
  const theme = moodThemes[themeKey] || moodThemes.default;
  const isDark = themeKey === 'darkLuxe' || themeKey === 'studio';

  // Compute whether the accent needs light or dark text (luminance threshold 0.5)
  const accentHex = theme.accent.replace('#', '');
  const accentR = parseInt(accentHex.slice(0, 2), 16);
  const accentG = parseInt(accentHex.slice(2, 4), 16);
  const accentB = parseInt(accentHex.slice(4, 6), 16);
  const accentLum = (0.299 * accentR + 0.587 * accentG + 0.114 * accentB) / 255;
  const ctaTextColor = accentLum < 0.5 ? '#ffffff' : '#0f172a';

  const specialtyLabel = categoryIds
    .map(id => serviceCategories.find(c => c.id === id)?.label)
    .filter(Boolean)
    .join(' · ');

  const textSecondary = isDark
    ? 'rgba(255,255,255,0.55)'
    : `${theme.textPrimary}88`;

  const borderColor = isDark
    ? 'rgba(255,255,255,0.1)'
    : `${theme.textPrimary}14`;

  const displayServices = services.slice(0, 3);

  function formatDur(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return m > 0 ? `${h} год ${m} хв` : `${h} год`;
    return `${m} хв`;
  }

  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: `linear-gradient(160deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Blob background */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 -right-16 size-48 rounded-full opacity-30"
          style={{ background: theme.accent, filter: 'blur(40px)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 size-36 rounded-full opacity-20"
          style={{ background: theme.gradient[0], filter: 'blur(32px)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-y-auto scrollbar-hide">
        {/* Status bar mock */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
            9:41
          </span>
          <div className="flex items-center gap-1" aria-hidden="true">
            <div className="w-3.5 h-2 rounded-[2px] border" style={{ borderColor: `${theme.textPrimary}60` }}>
              <div className="w-2/3 h-full rounded-[1px]" style={{ background: theme.textPrimary }} />
            </div>
          </div>
        </div>

        {/* Hero section */}
        <div className="flex flex-col items-center px-4 pt-3 pb-4">
          {/* Avatar */}
          <div
            className="size-16 rounded-[18px] flex items-center justify-center mb-3 overflow-hidden border-2"
            style={{
              borderColor: `${theme.accent}50`,
              background: avatarUrl ? undefined : `${theme.accent}25`,
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span
                className="text-lg font-bold"
                style={{ color: theme.accent }}
              >
                {initials || '?'}
              </span>
            )}
          </div>

          {/* Name + badge */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1
              className="text-[15px] font-bold leading-tight text-center"
              style={{ color: theme.textPrimary }}
            >
              {name || 'Ваше ім\'я'}
            </h1>
            <BadgeCheck size={13} style={{ color: theme.accent }} />
          </div>

          {specialtyLabel && (
            <p className="text-[10px] text-center mb-2" style={{ color: textSecondary }}>
              {specialtyLabel}
            </p>
          )}

          {/* Rating */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{
              background: `${theme.accent}18`,
              border: `1px solid ${theme.accent}30`,
            }}
          >
            <Star size={9} fill={theme.accent} style={{ color: theme.accent }} />
            <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
              5.0
            </span>
            <span className="text-[10px]" style={{ color: textSecondary }}>
              · перший запис
            </span>
          </div>
        </div>

        {/* Services */}
        {displayServices.length > 0 && (
          <div className="px-3 pb-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1"
              style={{ color: textSecondary }}
            >
              Послуги
            </p>
            <div className="flex flex-col gap-2">
              {displayServices.map((svc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 border"
                  style={{
                    background: theme.cardBg,
                    borderColor,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-semibold truncate leading-tight"
                      style={{ color: theme.textPrimary }}
                    >
                      {svc.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={8} style={{ color: textSecondary }} />
                      <span className="text-[9px]" style={{ color: textSecondary }}>
                        {formatDur(svc.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[12px] font-bold" style={{ color: theme.textPrimary }}>
                      {svc.price.toLocaleString('uk-UA')} ₴
                    </span>
                    <div
                      className="size-6 rounded-lg flex items-center justify-center"
                      style={{ background: theme.accent }}
                    >
                      <Calendar size={10} style={{ color: ctaTextColor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no services */}
        {displayServices.length === 0 && (
          <div className="px-3 pb-3">
            <div
              className="rounded-xl border px-3 py-4 text-center"
              style={{ background: theme.cardBg, borderColor }}
            >
              <p className="text-[11px] font-medium" style={{ color: theme.textPrimary }}>
                Послуги незабаром
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: textSecondary }}>
                Ви зможете додати їх у кабінеті
              </p>
            </div>
          </div>
        )}

        {/* CTA button */}
        <div className="px-3 pb-4 mt-auto">
          <div
            className="w-full py-2.5 rounded-xl text-center text-[12px] font-semibold"
            style={{
              background: theme.accent,
              color: ctaTextColor,
            }}
          >
            Записатися
          </div>
        </div>
      </div>
    </div>
  );
}

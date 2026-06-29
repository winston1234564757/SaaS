'use client';

import React from 'react';
import { Calendar, Zap, Star } from 'lucide-react';
import type { CanvasProps } from './storyTypes';
import { formatUA } from './storyConstants';

interface ModeContentProps extends CanvasProps {
  plateStyle: React.CSSProperties;
  alignStyle: React.CSSProperties;
  s: number; // textScale
}

function ModeContent({
  mode, pal, plateStyle, alignStyle, s,
  headingFont, bodyFont, headingWeight, uppercase, letterSpacing,
  textColor, mutedColor, textShadow,
  annoText, slotsDate, slots, slotsLoading, selectedServiceName,
  vacStart, vacEnd, selectedDeal,
  reviewText, reviewClientName,
  flashWinSvcName, flashWinDate, flashWinTime, flashWinDiscount,
  portfolioTitle, portfolioDesc,
}: ModeContentProps) {
  const headingCss: React.CSSProperties = {
    fontFamily: headingFont, fontWeight: headingWeight, color: textColor,
    letterSpacing, textTransform: uppercase ? 'uppercase' : 'none', margin: 0,
  };
  const bodyCss: React.CSSProperties = { fontFamily: bodyFont, color: mutedColor, margin: 0 };

  if (mode === 'announcement') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ ...headingCss, fontSize: 26 * s, lineHeight: 1.25, whiteSpace: 'pre-wrap', ...alignStyle }}>
          {annoText || 'Ваш анонс тут'}
        </p>
      </div>
    );
  }

  if (mode === 'free_slots') {
    const visibleSlots = slots.slice(0, 9);
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ ...bodyCss, fontSize: 13 * s, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {slotsDate ? formatUA(slotsDate) : 'Вільні вікна'}
        </p>
        {slotsLoading ? (
          <p style={{ ...bodyCss, fontSize: 15 * s }}>Завантаження...</p>
        ) : visibleSlots.length === 0 ? (
          <p style={{ ...bodyCss, fontSize: 15 * s }}>Немає вільних слотів</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {visibleSlots.map(slot => (
              <span key={slot} style={{ background: pal.pill, color: pal.pillText, borderRadius: 10, padding: '6px 14px', fontFamily: bodyFont, fontSize: 15 * s, fontWeight: 700 }}>{slot}</span>
            ))}
          </div>
        )}
        {selectedServiceName && (
          <p style={{ ...bodyCss, fontSize: 12 * s }}>{selectedServiceName}</p>
        )}
      </div>
    );
  }

  if (mode === 'vacation') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} strokeWidth={1.5} color={mutedColor} />
          <p style={{ ...bodyCss, fontSize: 13 * s, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Відпустка</p>
        </div>
        <p style={{ ...headingCss, fontSize: 22 * s }}>
          {vacStart && vacEnd ? `${formatUA(vacStart)} — ${formatUA(vacEnd)}` : 'Оберіть дати'}
        </p>
        <p style={{ ...bodyCss, fontSize: 13 * s }}>Запис відновлюється після повернення</p>
      </div>
    );
  }

  if (mode === 'promo') {
    const discountPct = selectedDeal?.discount_pct ?? 20;
    const svcName = selectedDeal?.service_name ?? 'Послуга';
    const origPrice = selectedDeal?.original_price ?? 0;
    const discPrice = Math.round(origPrice * (1 - discountPct / 100));
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} strokeWidth={1.5} color={pal.dot} />
          <p style={{ fontFamily: bodyFont, fontSize: 13 * s, fontWeight: 700, color: pal.dot, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flash Deal</p>
        </div>
        <p style={{ ...headingCss, fontSize: 22 * s }}>{svcName}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: bodyFont, fontSize: 28 * s, fontWeight: 800, color: pal.dot }}>{discPrice} грн</span>
          <span style={{ fontFamily: bodyFont, fontSize: 15 * s, color: mutedColor, textDecoration: 'line-through' }}>{origPrice} грн</span>
        </div>
        <div style={{ background: pal.dot, color: '#fff', borderRadius: 8, padding: '4px 12px', alignSelf: 'flex-start', fontFamily: bodyFont, fontSize: 13 * s, fontWeight: 700 }}>-{discountPct}%</div>
      </div>
    );
  }

  if (mode === 'review_spotlight') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} strokeWidth={0} fill={pal.dot} color={pal.dot} />)}
        </div>
        <p style={{ ...headingCss, fontSize: 19 * s, fontWeight: 600, lineHeight: 1.4, fontStyle: 'italic' }}>
          {reviewText || 'Чудовий майстер! Буду повертатися знову.'}
        </p>
        <p style={{ ...bodyCss, fontSize: 13 * s }}>— {reviewClientName || 'Клієнт'}</p>
      </div>
    );
  }

  if (mode === 'flash_window') {
    const discStr = flashWinDiscount > 0 ? ` -${flashWinDiscount}%` : '';
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: pal.dot, color: '#fff', borderRadius: 6, padding: '2px 8px', fontFamily: bodyFont, fontSize: 11 * s, fontWeight: 700, textTransform: 'uppercase' }}>
            {discStr ? `Знижка${discStr}` : 'Гаряче вікно'}
          </span>
        </div>
        <p style={{ ...headingCss, fontSize: 22 * s }}>{flashWinSvcName || 'Послуга'}</p>
        {flashWinDate && flashWinTime && (
          <p style={{ ...bodyCss, fontSize: 15 * s, fontWeight: 600 }}>
            {formatUA(flashWinDate)} о {flashWinTime}
          </p>
        )}
      </div>
    );
  }

  if (mode === 'portfolio_item') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {portfolioTitle && <p style={{ ...headingCss, fontSize: 22 * s }}>{portfolioTitle}</p>}
        {portfolioDesc && <p style={{ ...bodyCss, fontSize: 14 * s, lineHeight: 1.5 }}>{portfolioDesc}</p>}
      </div>
    );
  }

  return null;
}

function StoryCanvasInner(props: CanvasProps) {
  const {
    pal, showAvatar, avatarBlob, displayName, slug,
    platePos, align, treatment, textScale,
    headingFont, textColor, mutedColor, plateBg, textShadow,
    bgPhotoUrl, bgGradientCss, showLinkZone, isExporting,
  } = props;

  const s = textScale;

  const plateStyle: React.CSSProperties =
    treatment === 'plain'
      ? { background: 'transparent', textShadow }
      : treatment === 'glass'
        ? { background: plateBg, backdropFilter: 'blur(8px)' }
        : { background: plateBg };

  const alignStyle: React.CSSProperties = { textAlign: align };

  const plateJustify =
    platePos === 'top' ? 'flex-start' :
    platePos === 'bottom' ? 'flex-end' : 'center';

  return (
    <div
      style={{
        position: 'relative',
        width: 360,
        height: 640,
        background: pal.bg,
        overflow: 'hidden',
        borderRadius: isExporting ? 0 : 20,
        flexShrink: 0,
      }}
    >
      {bgGradientCss && !bgPhotoUrl && (
        <div style={{ position: 'absolute', inset: 0, background: bgGradientCss }} />
      )}

      {bgPhotoUrl && (
        <img
          src={bgPhotoUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          crossOrigin="anonymous"
        />
      )}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: plateJustify, padding: '28px 20px', gap: 16 }}>
        {showAvatar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {avatarBlob && (
              <img
                src={avatarBlob}
                alt=""
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                crossOrigin="anonymous"
              />
            )}
            <div style={{ textShadow }}>
              <p style={{ fontFamily: headingFont, fontSize: 14, fontWeight: 700, color: textColor, margin: 0 }}>{displayName}</p>
              <p style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', fontSize: 11, color: mutedColor, margin: 0 }}>bookit.com.ua/{slug}</p>
            </div>
          </div>
        )}

        <ModeContent {...props} plateStyle={plateStyle} alignStyle={alignStyle} s={s} />
      </div>

      <div style={{ position: 'absolute', bottom: 14, right: 18, display: 'flex', alignItems: 'center', gap: 4, textShadow }}>
        <span style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', fontSize: 10, fontWeight: 700, color: mutedColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>bookit.com.ua</span>
      </div>

      {showLinkZone && (
        <div style={{
          position: 'absolute', bottom: 64, left: 28, right: 28, height: 54,
          border: `1.5px dashed ${textColor}`, borderRadius: 14, opacity: 0.4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!isExporting && (
            <span style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', fontSize: 11, fontWeight: 600, color: textColor }}>
              Місце для кнопки
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const StoryCanvas = React.memo(StoryCanvasInner);

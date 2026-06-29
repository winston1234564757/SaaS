'use client';

import React from 'react';
import { Calendar, Zap, Star } from 'lucide-react';
import type { CanvasProps } from './storyTypes';
import { SANS, SERIF, formatUA } from './storyConstants';

interface ModeContentProps extends CanvasProps {
  plateStyle: React.CSSProperties;
  alignStyle: React.CSSProperties;
}

function ModeContent({
  mode, pal, plateStyle, alignStyle,
  annoText, slotsDate, slots, slotsLoading, selectedServiceName,
  vacStart, vacEnd, selectedDeal,
  reviewText, reviewClientName,
  flashWinSvcName, flashWinDate, flashWinTime, flashWinDiscount,
  portfolioTitle, portfolioDesc,
}: ModeContentProps) {
  if (mode === 'announcement') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, lineHeight: 1.25, color: pal.text, margin: 0, whiteSpace: 'pre-wrap', ...alignStyle }}>
          {annoText || 'Ваш анонс тут'}
        </p>
      </div>
    );
  }

  if (mode === 'free_slots') {
    const visibleSlots = slots.slice(0, 9);
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: pal.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {slotsDate ? formatUA(slotsDate) : 'Вільні вікна'}
        </p>
        {slotsLoading ? (
          <p style={{ fontFamily: SANS, fontSize: 15, color: pal.muted, margin: 0 }}>Завантаження...</p>
        ) : visibleSlots.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 15, color: pal.muted, margin: 0 }}>Немає вільних слотів</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {visibleSlots.map(s => (
              <span key={s} style={{ background: pal.pill, color: pal.pillText, borderRadius: 10, padding: '6px 14px', fontFamily: SANS, fontSize: 15, fontWeight: 700 }}>{s}</span>
            ))}
          </div>
        )}
        {selectedServiceName && (
          <p style={{ fontFamily: SANS, fontSize: 12, color: pal.muted, margin: 0 }}>{selectedServiceName}</p>
        )}
      </div>
    );
  }

  if (mode === 'vacation') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} strokeWidth={1.5} color={pal.muted} />
          <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: pal.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Відпустка</p>
        </div>
        {vacStart && vacEnd ? (
          <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: pal.text, margin: 0 }}>
            {formatUA(vacStart)} — {formatUA(vacEnd)}
          </p>
        ) : (
          <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: pal.text, margin: 0 }}>Оберіть дати</p>
        )}
        <p style={{ fontFamily: SANS, fontSize: 13, color: pal.muted, margin: 0 }}>Запис відновлюється після повернення</p>
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
          <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: pal.dot, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flash Deal</p>
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: pal.text, margin: 0 }}>{svcName}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: SANS, fontSize: 28, fontWeight: 800, color: pal.dot }}>{discPrice} грн</span>
          <span style={{ fontFamily: SANS, fontSize: 15, color: pal.muted, textDecoration: 'line-through' }}>{origPrice} грн</span>
        </div>
        <div style={{ background: pal.dot, color: '#fff', borderRadius: 8, padding: '4px 12px', alignSelf: 'flex-start', fontFamily: SANS, fontSize: 13, fontWeight: 700 }}>-{discountPct}%</div>
      </div>
    );
  }

  if (mode === 'review_spotlight') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1,2,3,4,5].map(i => <Star key={i} size={16} strokeWidth={0} fill={pal.dot} color={pal.dot} />)}
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, lineHeight: 1.4, color: pal.text, margin: 0, fontStyle: 'italic' }}>
          {reviewText || 'Чудовий майстер! Буду повертатися знову.'}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 13, color: pal.muted, margin: 0 }}>— {reviewClientName || 'Клієнт'}</p>
      </div>
    );
  }

  if (mode === 'flash_window') {
    const discStr = flashWinDiscount > 0 ? ` -${flashWinDiscount}%` : '';
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: pal.dot, color: '#fff', borderRadius: 6, padding: '2px 8px', fontFamily: SANS, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            {discStr ? `Знижка${discStr}` : 'Гаряче вікно'}
          </span>
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: pal.text, margin: 0 }}>{flashWinSvcName || 'Послуга'}</p>
        {flashWinDate && flashWinTime && (
          <p style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: pal.muted, margin: 0 }}>
            {formatUA(flashWinDate)} о {flashWinTime}
          </p>
        )}
      </div>
    );
  }

  if (mode === 'portfolio_item') {
    return (
      <div style={{ ...plateStyle, borderRadius: 20, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {portfolioTitle && (
          <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: pal.text, margin: 0 }}>{portfolioTitle}</p>
        )}
        {portfolioDesc && (
          <p style={{ fontFamily: SANS, fontSize: 14, color: pal.muted, margin: 0, lineHeight: 1.5 }}>{portfolioDesc}</p>
        )}
      </div>
    );
  }

  return null;
}

function StoryCanvasInner(props: CanvasProps) {
  const {
    pal, mode, showAvatar, avatarBlob, displayName, slug,
    platePos, textAlign, transparency,
    bgPhotoUrl, bgGradientCss, isExporting,
    showSticker = true,
    ctaText = 'Записатися онлайн',
  } = props;

  const plateAlpha = Math.round((1 - transparency / 100) * 255).toString(16).padStart(2, '0');
  const plateStyle: React.CSSProperties = {
    background: `${pal.pill}${plateAlpha}`,
    backdropFilter: transparency > 0 ? `blur(${Math.round(transparency / 5)}px)` : undefined,
  };

  const alignStyle: React.CSSProperties = { textAlign };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showAvatar && avatarBlob && (
            <img
              src={avatarBlob}
              alt=""
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              crossOrigin="anonymous"
            />
          )}
          <div>
            <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: pal.text, margin: 0 }}>{displayName}</p>
            <p style={{ fontFamily: SANS, fontSize: 11, color: pal.muted, margin: 0 }}>bookit.com.ua/{slug}</p>
          </div>
        </div>

        <ModeContent {...props} plateStyle={plateStyle} alignStyle={alignStyle} />
      </div>

      <div style={{ position: 'absolute', bottom: 14, right: 18, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: pal.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>bookit.com.ua</span>
      </div>

      {showSticker && (
        <div style={{ position: 'absolute', bottom: 14, left: 18 }}>
          <div style={{ background: pal.sticker, color: pal.stickerText, borderRadius: 10, padding: '5px 12px', fontFamily: SANS, fontSize: 11, fontWeight: 700 }}>
            {ctaText || 'Записатися онлайн'}
          </div>
        </div>
      )}
    </div>
  );
}

export const StoryCanvas = React.memo(StoryCanvasInner);

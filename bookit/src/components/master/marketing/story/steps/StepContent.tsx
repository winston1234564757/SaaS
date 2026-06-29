'use client';

import { cn } from '@/lib/utils/cn';
import { INPUT_STYLE, TEXT_TEMPLATES } from '../storyConstants';
import type { StoryEditorState, StorySetters, ServiceSlim, FlashDealRow, StarReview } from '../storyTypes';

interface StepContentProps {
  state: StoryEditorState;
  set: StorySetters;
  services: ServiceSlim[];
  flashDeals: FlashDealRow[];
  starReviews: StarReview[];
  slots: string[];
  slotsLoading: boolean;
  flashWinSlots: string[];
  flashWinSlotsLoading: boolean;
  todayStr: string;
  selectedReview: StarReview | null;
}

export function StepContent({
  state, set, services, flashDeals, starReviews,
  slots, slotsLoading, flashWinSlots, flashWinSlotsLoading, todayStr, selectedReview,
}: StepContentProps) {
  const { mode } = state;
  const textTemplates = mode === 'announcement' ? (TEXT_TEMPLATES.announcement ?? []) : [];

  return (
    <div className="space-y-3">
      {mode === 'announcement' && (
        <>
          {textTemplates.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Готові формулювання</label>
              <div className="flex flex-col gap-1.5">
                {textTemplates.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set.setAnnoText(t)}
                    className="text-left text-xs leading-snug text-text-secondary bg-secondary/60 border border-border rounded-xl px-3 py-2.5 transition-colors duration-150 cursor-pointer active:scale-[0.99] hover:text-foreground line-clamp-2"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Текст публікації</label>
            <textarea value={state.annoText} onChange={e => set.setAnnoText(e.target.value)}
              rows={3} maxLength={200} placeholder="Ваш текст..."
              className="resize-none outline-none text-sm transition-colors duration-150" style={{ ...INPUT_STYLE, height: 'auto' }} />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-muted-foreground/60">{state.annoText.length}/200</span>
            </div>
          </div>
        </>
      )}

      {mode === 'free_slots' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Послуга</label>
            {services.length === 0 ? (
              <div className="px-3 py-2.5 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">Немає послуг</div>
            ) : (
              <select value={state.selectedSvcId ?? ''} onChange={e => set.setSelectedSvcId(e.target.value || null)} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
                {services.map(s => <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name} ({s.duration_minutes} хв)</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Дата</label>
            <input type="date" value={state.slotsDate ?? ''} min={todayStr} onChange={e => set.setSlotsDate(e.target.value || null)} aria-label="Дата слоту для сторіс" className="outline-none text-sm" style={INPUT_STYLE} />
            {state.slotsDate && !slotsLoading && (
              <p className={`text-[11px] mt-1 font-medium ${slots.length > 0 ? 'text-success' : 'text-muted-foreground/60'}`}>
                {slots.length > 0 ? `${slots.length} вільних вікон` : 'Немає вікон'}
              </p>
            )}
          </div>
        </div>
      )}

      {mode === 'vacation' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">З якого числа</label>
            <input type="date" value={state.vacStart ?? ''} onChange={e => set.setVacStart(e.target.value || null)} aria-label="Початок відпустки" className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">По яке число</label>
            <input type="date" value={state.vacEnd ?? ''} min={state.vacStart ?? ''} onChange={e => set.setVacEnd(e.target.value || null)} aria-label="Кінець відпустки" className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
        </div>
      )}

      {mode === 'promo' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Активна Flash Deal</label>
          {flashDeals.length === 0 ? (
            <div className="px-3 py-2.5 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">
              Немає акцій. Створіть у <span className="font-semibold text-primary">Дохід → Flash Deals</span>.
            </div>
          ) : (
            <select value={state.dealIdx} onChange={e => set.setDealIdx(Number(e.target.value))} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
              {flashDeals.map((d, i) => <option key={d.id} value={i}>{d.service_name} · {Math.round(d.original_price / 100 * (1 - d.discount_pct / 100))}₴ (−{d.discount_pct}%)</option>)}
            </select>
          )}
        </div>
      )}

      {mode === 'review_spotlight' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">5★ відгук клієнта</label>
          {starReviews.length === 0 ? (
            <div className="px-3 py-2.5 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">Немає опублікованих 5★ відгуків</div>
          ) : (
            <select value={state.selectedReviewId ?? ''} onChange={e => set.setSelectedReviewId(e.target.value || null)} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
              {starReviews.map(r => <option key={r.id} value={r.id}>{r.client_name} — {(r.comment ?? '').slice(0, 40)}{(r.comment ?? '').length > 40 ? '...' : ''}</option>)}
            </select>
          )}
          {selectedReview?.comment && (
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed px-1 line-clamp-2">«{selectedReview.comment}»</p>
          )}
        </div>
      )}

      {mode === 'flash_window' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Послуга</label>
              {services.length === 0 ? (
                <div className="px-3 py-2.5 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">Немає послуг</div>
              ) : (
                <select value={state.flashWinSvcId ?? ''} onChange={e => set.setFlashWinSvcId(e.target.value || null)} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name} ({s.duration_minutes} хв)</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Дата</label>
              <input type="date" value={state.flashWinDate ?? ''} min={todayStr} onChange={e => set.setFlashWinDate(e.target.value || null)} aria-label="Дата флеш-пропозиції" className="outline-none text-sm" style={INPUT_STYLE} />
            </div>
          </div>
          <div className="space-y-3">
            {state.flashWinDate && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Час слоту</label>
                {flashWinSlotsLoading ? (
                  <p className="text-[11px] text-muted-foreground/60">Завантаження...</p>
                ) : flashWinSlots.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/60">Немає вільних вікон</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {flashWinSlots.map(s => (
                      <button key={s} type="button" onClick={() => set.setFlashWinTime(s)}
                        className={cn('px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer active:scale-[0.88]',
                          state.flashWinTime === s ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)]' : 'bg-secondary/70 text-text-secondary border border-border')}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Знижка: <span className="text-destructive font-bold">−{state.flashWinDiscount}%</span></label>
              <input type="range" min={5} max={70} step={5} value={state.flashWinDiscount}
                onChange={e => set.setFlashWinDiscount(Number(e.target.value))}
                aria-label="Відсоток знижки" className="w-full cursor-pointer" style={{ accentColor: 'var(--accent)' }} />
              <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-0.5"><span>5%</span><span>70%</span></div>
            </div>
          </div>
        </div>
      )}

      {mode === 'portfolio_item' && (
        <div className="px-3 py-2.5 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">
          Оберіть роботу як фон у наступному кроці «Вигляд».
        </div>
      )}
    </div>
  );
}

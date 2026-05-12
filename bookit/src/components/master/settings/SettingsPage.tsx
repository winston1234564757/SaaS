'use client';

import { useState } from 'react';
import { useSettingsForm } from './hooks/useSettingsForm';
import { NavigationStrip } from './widgets/NavigationStrip';
import { ProfileHero } from './widgets/ProfileHero';
import { PublicStatusWidget } from './widgets/PublicStatusWidget';
import { ScheduleWidget } from './widgets/ScheduleWidget';
import { StatsPulseWidget } from './widgets/StatsPulseWidget';
import { SmartAdvisor } from './widgets/SmartAdvisor';
import { TechnicalIsland } from './widgets/TechnicalIsland';
import { LocationWidget } from './widgets/LocationWidget';
import { CategoriesWidget } from './widgets/CategoriesWidget';
import { ProductMixWidget } from './widgets/ProductMixWidget';
import { VacationManager } from './VacationManager';
import { SegmentConfigWidget } from './widgets/SegmentConfigWidget';
import { useMasterContext } from '@/lib/supabase/context';
import { useAnalytics } from '@/lib/supabase/hooks/useAnalytics';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, LogOut, User as UserIcon, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils/cn';

export default function SettingsPage() {
  const { masterProfile } = useMasterContext();
  const queryClient = useQueryClient();
  const { state, actions } = useSettingsForm();
  const [analyticsDate, setAnalyticsDate] = useState(new Date());

  const { data: analytics } = useAnalytics(
    { 
      startDate: format(startOfMonth(analyticsDate), 'yyyy-MM-dd'), 
      endDate: format(endOfMonth(analyticsDate), 'yyyy-MM-dd') 
    },
    masterProfile?.subscription_tier === 'pro' || masterProfile?.subscription_tier === 'studio',
    'month',
    0
  );
  
  const stats = useDashboardStats();

  if (!masterProfile) return null;

  // Prepare services for ProductMix
  const topServices = (analytics?.topServices ?? []).map(s => ({
    name: s.name,
    count: s.count,
    percentage: analytics?.summary.bookings ? Math.round((s.count / analytics.summary.bookings) * 100) : 0
  }));

  return (
    <div className="min-h-screen bg-background pb-32">
      <NavigationStrip />

      <main className="max-w-7xl mx-auto px-4 mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
          
          {/* Row 1: Profile Hero (Main Identity) */}
          <section id="hero" className="lg:col-span-1 lg:row-span-2">
            <ProfileHero
              masterId={masterProfile.id}
              fullName={state.fullName}
              businessName={state.businessName}
              bio={state.bio}
              avatarUrl={state.avatarUrl}
              tier={masterProfile.subscription_tier}
              rating={masterProfile.rating}
              ratingCount={masterProfile.rating_count}
              slug={state.slug}
              onAvatarChange={actions.setAvatarUrl}
            />
          </section>

          {/* Row 1, Col 2-3: Smart Advisor (High Impact) */}
          <section className="md:col-span-1 lg:col-span-2">
            <SmartAdvisor 
              data={{
                bio: state.bio,
                instagram: state.instagram,
                telegram: state.telegram,
                avatarUrl: state.avatarUrl,
                isPublished: state.isPublished,
                categories: state.selectedCategories,
                bufferTime: state.bufferTime
              }}
            />
          </section>

          {/* Row 1, Col 4: Public Status & QR */}
          <section id="status" className="md:col-span-1 lg:col-span-1">
            <PublicStatusWidget
              slug={state.slug}
              isPublished={state.isPublished}
              slugStatus={state.slugStatus}
              onSlugChange={actions.setSlug}
              onPublishToggle={() => actions.setIsPublished(!state.isPublished)}
            />
          </section>

          {/* Row 2: Analytics & Stats */}
          <section id="stats" className="md:col-span-1 lg:col-span-2">
            <StatsPulseWidget
              rating={masterProfile.rating}
              ratingCount={masterProfile.rating_count}
              viewsCount={0}
              bookingsCount={stats.monthCompleted}
            />
          </section>

          {/* Row 2, Col 4: Work Schedule */}
          <section id="schedule" className="md:col-span-1 lg:col-span-1">
            <ScheduleWidget
              schedule={state.schedule}
              bufferTime={state.bufferTime}
              breaks={state.breaks}
              retentionCycleDays={state.retentionCycleDays}
              occupancyData={stats.weekDayBookings}
              onScheduleChange={actions.setSchedule}
              onBufferChange={actions.setBufferTime}
              onBreaksChange={actions.setBreaks}
              onRetentionCycleDaysChange={actions.setRetentionCycleDays}
            />
          </section>

          {/* Row 3: Product Mix & Categories */}
          <section id="services" className="lg:col-span-1">
            <ProductMixWidget 
              services={topServices}
              onMonthChange={setAnalyticsDate}
            />
          </section>

          <section className="lg:col-span-1">
            <CategoriesWidget 
              selected={state.selectedCategories}
              onChange={actions.setSelectedCategories}
            />
          </section>

          <section id="location" className="lg:col-span-2">
            <LocationWidget 
              city={state.city}
              address={state.address}
              floor={state.floor}
              cabinet={state.cabinet}
              lat={state.lat}
              lng={state.lng}
              onCityChange={actions.setCity}
              onAddressChange={actions.setAddress}
              onFloorChange={actions.setFloor}
              onCabinetChange={actions.setCabinet}
              onCoordsChange={actions.setCoords}
            />
          </section>

          {/* Row 3.5: CRM Segments */}
          <section id="segments" className="lg:col-span-2">
            <SegmentConfigWidget
              segments={state.segmentConfig}
              onChange={actions.setSegmentConfig}
            />
          </section>

          {/* Row 4: Technical Settings & Vacations */}
          <section id="technical" className="md:col-span-2">
            <TechnicalIsland
              instagram={state.instagram}
              telegram={state.telegram}
              telegramChatId={state.telegramChatId}
              themeKey={state.themeKey}
              onInstagramChange={actions.setInstagram}
              onTelegramChange={actions.setTelegram}
              onTelegramChatIdChange={actions.setTelegramChatId}
              onThemeChange={actions.setThemeKey}
            />
          </section>

          {/* Row 5: Identity Settings */}
          <section id="identity" className="md:col-span-2">
            <div className="widget-card p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                   <UserIcon size={20} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-text-primary">Особисті дані</h3>
                   <p className="text-xs text-text-mute">Налаштування вашого імені та публічного фото</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-mute uppercase tracking-widest px-1">Ваше повне ім'я</label>
                  <input 
                    value={state.fullName}
                    onChange={(e) => actions.setFullName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-white/60 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none text-sm font-bold shadow-inner-sm transition-all"
                    placeholder="Напр. Олена Коваль"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-mute uppercase tracking-widest px-1">Бізнес-ім'я (Студія)</label>
                  <input 
                    value={state.businessName}
                    onChange={(e) => actions.setBusinessName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-white/60 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none text-sm font-bold shadow-inner-sm transition-all"
                    placeholder="Напр. Glow Studio"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/40">
                <button 
                  onClick={() => {
                     // Find the button in Hero (id=hero) and click its invisible input
                     const heroInput = document.querySelector('#hero input[type="file"]');
                     if (heroInput) (heroInput as HTMLElement).click();
                  }}
                  className="px-6 py-4 rounded-2xl bg-white border border-white/80 text-text-primary text-xs font-bold flex items-center gap-2 hover:bg-muted/10 active:scale-95 transition-all shadow-sm"
                >
                  <Camera size={16} className="text-accent" /> Змінити головне фото
                </button>
              </div>
            </div>
          </section>

          <section id="vacations" className="md:col-span-2">
            <div className="widget-card p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-mute">Відпустки та вихідні</h3>
              </div>
              <VacationManager />
            </div>
          </section>

        </div>

        {/* System Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              document.cookie = 'view_mode=client; path=/; max-age=86400';
              window.location.href = '/my/bookings';
            }}
            className="p-5 rounded-[32px] text-sm font-bold text-accent bg-white border border-white/80 hover:bg-muted/10 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <UserIcon size={18} /> Перейти в режим клієнта
          </button>

          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              queryClient.clear();
              document.cookie = 'user_role=; path=/; max-age=0';
              window.location.href = '/login';
            }}
            className="p-5 rounded-[32px] text-sm font-bold text-error bg-error/5 border border-error/10 hover:bg-error/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Вийти з акаунту
          </button>
        </div>
      </main>

      <AnimatePresence>
        {state.isDirty && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-[60] flex justify-center pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-2xl border border-white p-2 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto">
              <div className="pl-5 pr-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-primary whitespace-nowrap">Незбережені зміни</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={actions.handleCancel}
                  disabled={state.saving}
                  className="px-5 py-3 rounded-full text-xs font-bold text-text-mute hover:bg-muted/10 transition-colors whitespace-nowrap"
                >
                  Скасувати
                </button>
                <button
                  onClick={actions.handleSave}
                  disabled={state.saving || state.slugStatus === 'taken'}
                  className={cn(
                    "px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all whitespace-nowrap",
                    state.isDirty ? "bg-success shadow-success/20 hover:scale-105" : "bg-accent shadow-accent/20"
                  )}
                >
                  {state.saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Зберегти'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

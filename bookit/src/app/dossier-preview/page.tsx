import { ClientDossierHero } from '@/components/master/clients/ClientDossierHero';

// ТИМЧАСОВИЙ прев'ю-роут (C-CLI-01) для рендера власними очима поза auth. Видалити перед commit.

export const dynamic = 'force-static';

const RET = {
  active: { label: 'Активний', text: '#6EE7B7', glow: '#34D399' },
  at_risk: { label: 'Під ризиком', text: '#FDBA74', glow: '#FB923C' },
  lost: { label: 'Втрачений', text: '#FCA5A5', glow: '#F87171' },
};

export default function DossierPreview() {
  return (
    <div data-theme="frost" style={{ background: '#EFF2FF', minHeight: '100vh' }} className="py-8">
      <div className="mx-auto max-w-md px-5 flex flex-col gap-8">

        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">1 · Повний (VIP · під ризиком · алергія · амбасадор · ранг)</p>
          <ClientDossierHero
            name="Олена Коваленко"
            phone="+380 67 123 45 67"
            retentionLabel={RET.at_risk.label}
            retentionText={RET.at_risk.text}
            retentionGlow={RET.at_risk.glow}
            isVip
            isAmbassador
            hasAlert
            totalSpentLabel="42 400 ₴"
            showRank
            rank={3}
            totalClients={76}
            spentPct={82}
            cadenceText="Приходить приблизно раз на 3 тижні"
            byNumbers={[
              { label: 'Візити', value: '14' },
              { label: 'Середній чек', value: '3 030 ₴' },
              { label: 'Останній візит', value: '2 міс тому' },
            ]}
          />
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">2 · Новий клієнт (активний · без VIP/алергії/рангу)</p>
          <ClientDossierHero
            name="Ірина"
            phone="+380 50 000 11 22"
            retentionLabel={RET.active.label}
            retentionText={RET.active.text}
            retentionGlow={RET.active.glow}
            isVip={false}
            isAmbassador={false}
            hasAlert={false}
            totalSpentLabel="850 ₴"
            showRank={false}
            rank={0}
            totalClients={1}
            spentPct={0}
            cadenceText={null}
            byNumbers={[
              { label: 'Візити', value: '1' },
              { label: 'Середній чек', value: '850 ₴' },
              { label: 'Останній візит', value: 'вчора' },
            ]}
          />
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">3 · Довге ім'я + втрачений</p>
          <ClientDossierHero
            name="Олександра-Вікторія Богуславська-Мельниченко"
            phone="+380 63 777 88 99"
            retentionLabel={RET.lost.label}
            retentionText={RET.lost.text}
            retentionGlow={RET.lost.glow}
            isVip={false}
            isAmbassador={false}
            hasAlert
            totalSpentLabel="18 900 ₴"
            showRank
            rank={41}
            totalClients={76}
            spentPct={12}
            cadenceText="Приходить приблизно раз на 4 місяці"
            byNumbers={[
              { label: 'Візити', value: '9' },
              { label: 'Середній чек', value: '2 100 ₴' },
              { label: 'Останній візит', value: '5 міс тому' },
            ]}
          />
        </div>

        {/* Booking receipt dark cover (мок band, той самий slate) */}
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">4 · Картка запису — темна обкладинка-чек (один стиль)</p>
          <div className="bento-card overflow-hidden" style={{ background: 'rgba(218,226,255,0.90)', borderRadius: 24 }}>
            <div
              className="relative overflow-hidden px-5 pt-5 pb-4 text-white"
              style={{ background: 'linear-gradient(157deg, #1E293B 0%, #0F172A 52%, #0B1220 100%)' }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 0% 0%, #FB923C40 0%, transparent 56%)' }} />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 mb-1.5">Запис на</p>
                  <p className="heading-serif text-[26px] leading-[1.05] text-white">3 липня</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-white">
                    <span className="tabular-nums">14:00 — 15:30</span>
                    <span className="text-white/55 font-medium">· 1 год 30 хв</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-200 bg-indigo-400/15 px-2.5 py-1 rounded-full shrink-0">Онлайн</span>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Стрижка + укладка</span>
              <span className="text-sm font-bold text-foreground tabular-nums">750 ₴</span>
            </div>
            <div className="px-5 pb-5 pt-4 border-t-2 border-dashed border-border/70 flex items-baseline justify-between">
              <span className="text-[11px] font-bold text-text-sub uppercase tracking-[0.2em]">Разом</span>
              <span className="heading-serif text-3xl text-foreground tabular-nums">750 ₴</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

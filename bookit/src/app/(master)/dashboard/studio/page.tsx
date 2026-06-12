import type { Metadata } from 'next';
import { Building2, Users, BarChart2, Layers } from 'lucide-react';
import { StudioBetaCard } from '@/components/master/studio/StudioBetaCard';

export const metadata: Metadata = { title: 'Студія — Bookit' };

const STUDIO_COLOR = '#5C9E7A';

const features = [
  {
    icon: Users,
    title: 'Команда майстрів',
    desc: 'Один кабінет для всіх. Додавайте майстрів, розподіляйте завдання, переглядайте записи кожного.',
  },
  {
    icon: BarChart2,
    title: 'Спільна аналітика',
    desc: 'Переглядайте виручку і навантаження по всій команді — без ручного зведення таблиць.',
  },
  {
    icon: Layers,
    title: 'Сторінка салону',
    desc: 'Клієнти заходять на одну сторінку і самі обирають майстра та час.',
  },
];

export default function StudioPage() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="bento-card p-5">
        <div className="flex items-center gap-2.5 mb-0.5">
          <h1 className="heading-serif text-xl text-foreground">Студія</h1>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
            style={{ color: '#1E5C3F', background: `${STUDIO_COLOR}18` }}
          >
            У розробці
          </span>
        </div>
        <p className="text-sm text-muted-foreground/60">Для команд та салонів</p>
      </div>

      {/* Feature preview */}
      <div className="bento-card p-6">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="size-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${STUDIO_COLOR}15` }}
          >
            <Building2 size={22} style={{ color: STUDIO_COLOR }} />
          </div>
          <div>
            <p className="text-base font-bold text-foreground mb-1">Studio в розробці</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Збираємо перші команди для закритого тесту. Залиште заявку — якщо підійдете, зв&apos;яжусь особисто.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-3 p-3 rounded-2xl"
              style={{ background: `${STUDIO_COLOR}08` }}
            >
              <div
                className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${STUDIO_COLOR}15` }}
              >
                <Icon size={15} style={{ color: STUDIO_COLOR }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beta CTA */}
      <StudioBetaCard />
    </div>
  );
}

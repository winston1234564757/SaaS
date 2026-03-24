import type { Metadata } from 'next';
import { Building2, Users, BarChart2, Layers } from 'lucide-react';
import { WaitlistButton } from '@/components/master/studio/WaitlistButton';

export const metadata: Metadata = { title: 'Студія — Bookit' };

const features = [
  {
    icon: Users,
    title: 'Команда майстрів',
    desc: 'Додавайте колег, розподіляйте ролі та керуйте командою з єдиного кабінету',
  },
  {
    icon: BarChart2,
    title: 'Зведена аналітика',
    desc: 'Бачте виручку, записи та ефективність кожного майстра у реальному часі',
  },
  {
    icon: Layers,
    title: 'Спільна сторінка салону',
    desc: 'Одна booking-сторінка для всієї студії — клієнти обирають майстра і слот',
  },
];

export default function StudioPage() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="bento-card p-5">
        <div className="flex items-center gap-2.5 mb-0.5">
          <h1 className="heading-serif text-xl text-[#2C1A14]">Студія</h1>
          <span className="text-[10px] font-bold text-white bg-[#789A99] px-2 py-0.5 rounded-full tracking-wide">
            У розробці
          </span>
        </div>
        <p className="text-sm text-[#A8928D]">Управління командою майстрів</p>
      </div>

      <div className="bento-card p-6 flex flex-col items-center gap-6 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(120,154,153,0.12)' }}
        >
          <Building2 size={34} className="text-[#789A99]" />
        </div>

        <div>
          <p className="text-xl font-bold text-[#2C1A14] mb-2">Модуль Studio готується</p>
          <p className="text-sm text-[#6B5750] max-w-xs leading-relaxed">
            Ми активно будуємо інструменти для команд та салонів.
            Залишіть контакт — сповістимо вас першими.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs text-left">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-3 rounded-2xl bg-white/50">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(120,154,153,0.12)' }}
              >
                <Icon size={15} className="text-[#789A99]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C1A14]">{title}</p>
                <p className="text-xs text-[#A8928D] leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <WaitlistButton featureSlug="studio" />
      </div>
    </div>
  );
}

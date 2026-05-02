import type { Metadata } from 'next';
import { RootPageClient } from '@/components/root/RootPageClient';

export const metadata: Metadata = {
  title: 'Bookit — Система, яка сама генерує дохід для б\'юті-майстра',
  description:
    'Смарт-слоти, флеш-акції, програма лояльності та Telegram-сповіщення для б\'юті-майстрів. Безкоштовно для старту.',
};

export default function RootPage() {
  return <RootPageClient />;
}

import type { Metadata } from 'next';
import { StoryGenerator } from '@/components/master/marketing/StoryGenerator';

export const metadata: Metadata = { title: 'Маркетинг — Bookit' };

export default function Page() {
  return <StoryGenerator />;
}

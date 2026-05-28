import type { Metadata } from 'next';
import { ReviewsPage } from '@/components/master/reviews/ReviewsPage';

export const metadata: Metadata = { title: 'Відгуки — Bookit' };

export default function ReviewsRoute() {
  return <ReviewsPage />;
}

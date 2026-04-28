import type { Metadata } from 'next';
import { ProductsPage } from '@/components/master/products/ProductsPage';

export const metadata: Metadata = { title: 'Магазин — Bookit' };

export default function Page() {
  return <ProductsPage />;
}

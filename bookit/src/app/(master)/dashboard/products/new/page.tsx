import type { Metadata } from 'next';
import { ProductEditor } from '@/components/master/products/ProductEditor';

export const metadata: Metadata = { title: 'Новий товар — Bookit' };

export default function Page() {
  return <ProductEditor />;
}

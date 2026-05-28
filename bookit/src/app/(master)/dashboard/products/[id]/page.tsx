import type { Metadata } from 'next';
import { ProductEditor } from '@/components/master/products/ProductEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Товар ${id} — Bookit` };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}

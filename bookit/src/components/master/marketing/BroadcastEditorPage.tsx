'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BroadcastEditor } from './BroadcastEditor';

interface Props {
  products: { id: string; name: string; price: number }[];
  broadcastsUsed: number;
  isStarter: boolean;
}

export function BroadcastEditorPage({ products, broadcastsUsed, isStarter }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawClientIds = searchParams.get('clientIds');
  const prefillClientIds = rawClientIds ? rawClientIds.split(',').filter(Boolean) : undefined;
  const prefillTemplateId = searchParams.get('templateId') ?? undefined;

  return (
    <BroadcastEditor
      onClose={() => router.back()}
      onSent={() => router.back()}
      products={products}
      broadcastsUsed={broadcastsUsed}
      isStarter={isStarter}
      prefillClientIds={prefillClientIds?.length ? prefillClientIds : undefined}
      prefillTemplateId={prefillTemplateId}
    />
  );
}

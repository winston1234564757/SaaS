export const LEGAL_DOCS = [
  { slug: 'public-offer',      label: 'Публічна оферта' },
  { slug: 'terms-of-service',  label: 'Умови надання послуг' },
  { slug: 'privacy-policy',    label: 'Конфіденційність' },
  { slug: 'refund-policy',     label: 'Повернення коштів' },
] as const;

export type LegalSlug = (typeof LEGAL_DOCS)[number]['slug'];

export const LEGAL_VERSIONS = {
  'public-offer':     '2025-05-01',
  'terms-of-service': '2025-05-01',
  'privacy-policy':   '2025-05-01',
  'refund-policy':    '2025-05-01',
} satisfies Record<LegalSlug, string>;

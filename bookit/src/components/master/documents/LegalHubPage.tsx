'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, RotateCcw, Handshake, ExternalLink } from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

const DOCS = [
  {
    slug: 'public-offer',
    icon: Handshake,
    label: 'Публічна оферта',
    desc: 'Умови підписки та рекурентні платежі',
  },
  {
    slug: 'terms-of-service',
    icon: FileText,
    label: 'Умови надання послуг',
    desc: 'Правила користування, SLA 99%',
  },
  {
    slug: 'privacy-policy',
    icon: ShieldCheck,
    label: 'Політика конфіденційності',
    desc: 'GDPR та захист персональних даних',
  },
  {
    slug: 'refund-policy',
    icon: RotateCcw,
    label: 'Повернення коштів',
    desc: 'Умови повернення за підписку',
  },
] as const;

export function LegalHubPage() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="bento-card p-5"
      >
        <h1 className="heading-serif text-xl text-foreground">Юридичні документи</h1>
        <p className="text-sm text-text-sub mt-0.5">
          ФОП Кошель Віктор Миколайович · РНОКПП 3705708939
        </p>
      </motion.div>

      {/* Bento grid — quiet, single neutral treatment */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-stretch">
        {DOCS.map((doc, i) => {
          const Icon = doc.icon;
          return (
            <motion.div
              key={doc.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.08 + i * 0.07 }}
              className="col-span-2 md:col-span-3"
            >
              <Link
                href={`/legal/${doc.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <div className="bento-card p-4 h-full flex flex-col gap-3 group active:scale-[0.98] hover:scale-[1.01] transition-transform duration-200 min-h-[120px]">
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 bg-background border border-border">
                      <Icon size={18} className="text-foreground" />
                    </div>
                    <ExternalLink size={13} className="text-text-sub mt-1" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground mb-1">{doc.label}</p>
                    <p className="text-xs text-text-sub leading-relaxed line-clamp-1">{doc.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bento-card p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">Питання щодо документів?</p>
          <p className="text-xs text-text-sub mt-0.5">Напишіть нам — відповімо протягом 2 робочих днів</p>
        </div>
        <a
          href="mailto:viktor.koshel24@gmail.com"
          className="shrink-0 text-xs font-semibold text-primary hover:text-primary/90 transition-colors ml-4"
        >
          Написати →
        </a>
      </motion.div>
    </div>
  );
}

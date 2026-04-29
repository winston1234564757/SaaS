'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Send, Zap } from 'lucide-react';
import { BroadcastEditor } from './BroadcastEditor';
import { BroadcastHistory } from './BroadcastHistory';

interface Product { id: string; name: string; price: number }

interface Props {
  broadcastsUsed: number;
  isStarter: boolean;
  isPro: boolean;
  products: Product[];
}

export function BroadcastsTab({ broadcastsUsed, isStarter, isPro, products }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSent = () => {
    setEditorOpen(false);
    setSuccessMsg('Розсилку відправлено!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Розсилки</h2>
          </div>
          <button
            onClick={() => setEditorOpen(true)}
            data-testid="new-broadcast-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-opacity active:opacity-80"
            style={{ background: 'linear-gradient(135deg, #2C1A14, #4A2E24)' }}
          >
            <Plus size={15} />
            Нова
          </button>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Push / Telegram / SMS по тегах клієнтів
        </p>
      </div>

      {/* Pro banner for Starter */}
      {isStarter && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-2xl flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(212,147,90,0.12), rgba(120,154,153,0.10))',
            border: '1px solid rgba(212,147,90,0.28)',
          }}
        >
          <Zap size={16} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {broadcastsUsed < 3
                ? `${3 - broadcastsUsed} безкоштовні розсилки залишилось`
                : 'Безкоштовний ліміт вичерпано'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pro: необмежені розсилки, детальна аналітика, smart-шаблони по тегах.
            </p>
          </div>
        </div>
      )}

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            data-testid="broadcast-success-toast"
            className="mx-4 mb-4 px-4 py-3 rounded-2xl flex items-center gap-2"
            style={{ background: 'rgba(92,158,122,0.12)', border: '1px solid rgba(92,158,122,0.25)' }}
          >
            <Send size={14} className="text-success" />
            <p className="text-sm font-medium text-success">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <BroadcastHistory />

      {/* Editor modal */}
      <AnimatePresence>
        {editorOpen && (
          <BroadcastEditor
            onClose={() => setEditorOpen(false)}
            onSent={handleSent}
            products={products}
            broadcastsUsed={broadcastsUsed}
            isStarter={isStarter}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

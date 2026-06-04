'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface SafetyData {
  healthNotes:  string | null;
  medicalNotes: string | null;
}

interface Props {
  /** master_id — current master */
  masterId: string;
  /** client_id from URL action or wizard state */
  clientId: string | null | undefined;
}

/**
 * Fetches health/medical notes for a client from client_master_relations
 * and renders a persistent safety alert if critical data is present.
 *
 * Renders nothing when clientId is absent or no notes exist.
 */
export function SafetyAlert({ masterId, clientId }: Props) {
  const [data,      setData]      = useState<SafetyData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!clientId) { setData(null); return; }

    const supabase = createClient();
    supabase
      .from('client_master_relations')
      .select('health_notes, medical_notes')
      .eq('master_id', masterId)
      .eq('client_id', clientId)
      .single()
      .then(({ data: row }: { data: { health_notes: string | null; medical_notes: string | null } | null }) => {
        if (!row) return;
        const hasContent = row.health_notes || row.medical_notes;
        if (hasContent) {
          setData({ healthNotes: row.health_notes, medicalNotes: row.medical_notes });
          setDismissed(false);
        }
      });
  }, [masterId, clientId]);

  const visible = data && !dismissed && (data.medicalNotes || data.healthNotes);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="safety-alert"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="overflow-hidden"
        >
          <div
            className="mx-4 mt-3 rounded-2xl px-4 py-3 flex gap-3"
            style={{
              background: data.medicalNotes ? 'rgba(192,91,91,0.10)' : 'rgba(212,147,90,0.10)',
              border: `0.5px solid ${data.medicalNotes ? 'var(--error)' : 'var(--warning, #D4935A)'}`,
            }}
          >
            <span style={{ color: data.medicalNotes ? 'var(--error)' : 'var(--warning, #D4935A)', flexShrink: 0, marginTop: 1 }}>
              <AlertTriangle size={16} strokeWidth={2} />
            </span>

            <div className="flex-1 min-w-0">
              {data.medicalNotes && (
                <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--error)' }}>
                  {data.medicalNotes}
                </p>
              )}
              {data.healthNotes && (
                <p
                  className={`text-[12px] leading-snug ${data.medicalNotes ? 'mt-1' : 'font-medium'}`}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {data.healthNotes}
                </p>
              )}
            </div>

            <button type="button"
              onClick={() => setDismissed(true)}
              className="self-start flex-shrink-0 -mr-1 p-0.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-tertiary)' }}
              aria-label="Закрити попередження"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

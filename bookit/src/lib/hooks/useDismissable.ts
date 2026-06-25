'use client';

import { useState, useEffect, useCallback } from 'react';

const TTL_MS = 12 * 60 * 60 * 1000; // 12 годин

interface DismissRecord {
  ts: number;
  fp: string;
}

/**
 * Тимчасовий dismiss для інфо-меседжів (mark-as-read-on-close патерн).
 *
 * Блок ховається при `dismiss()` і лишається схованим, доки:
 *  - не мине 12 год від моменту закриття, АБО
 *  - не зміниться `fingerprint` (нові дані = новий привід показати).
 *
 * Сховище — localStorage (per-device), ключ `bookit_dismiss_${key}`.
 * SSR-safe: стартує як НЕ dismissed, реальне рішення приймається в useEffect,
 * тож сервер і перший клієнт-рендер збігаються (без hydration mismatch).
 */
export function useDismissable(key: string, fingerprint: string | number) {
  const storageKey = `bookit_dismiss_${key}`;
  const fp = String(fingerprint);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { setDismissed(false); return; }
      const rec = JSON.parse(raw) as DismissRecord;
      const fresh = Date.now() - rec.ts < TTL_MS;
      setDismissed(fresh && rec.fp === fp);
    } catch {
      setDismissed(false);
    }
  }, [storageKey, fp]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ts: Date.now(), fp } satisfies DismissRecord));
    } catch {
      /* приватний режим / квота — мовчки ігноруємо, блок просто сховається на цю сесію */
    }
    setDismissed(true);
  }, [storageKey, fp]);

  return { dismissed, dismiss };
}

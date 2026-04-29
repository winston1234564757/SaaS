'use client';

import { LayoutDashboard } from 'lucide-react';

export function MasterModeBanner() {
  function backToDashboard() {
    document.cookie = 'view_mode=; path=/; max-age=0';
    window.location.href = '/dashboard';
  }

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 text-sm"
      style={{ background: 'rgba(120,154,153,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-2 text-white">
        <span className="text-base">👤</span>
        <span className="text-xs font-medium opacity-90">Режим клієнта</span>
      </div>
      <button
        onClick={backToDashboard}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors active:scale-95 transition-all"
      >
        <LayoutDashboard size={13} />
        До дашборду
      </button>
    </div>
  );
}

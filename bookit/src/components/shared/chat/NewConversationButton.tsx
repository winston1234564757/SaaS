'use client';

import { useState } from 'react';
import { PenSquare } from 'lucide-react';
import { NewConversationSheet } from './NewConversationSheet';

/** Header "+" entry that opens the role-aware new-conversation picker. */
export function NewConversationButton({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Нова розмова"
        className="flex items-center justify-center size-10 rounded-full bg-accent text-accent-foreground active:scale-[0.92] transition-transform"
      >
        <PenSquare size={18} />
      </button>
      <NewConversationSheet open={open} onOpenChange={setOpen} basePath={basePath} />
    </>
  );
}

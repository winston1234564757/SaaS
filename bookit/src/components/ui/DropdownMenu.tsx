'use client';

import { useRef, useEffect, useState, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  disabled?: boolean;
  triggerClassName?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  disabled,
  triggerClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(prev => !prev);
  }, [open, disabled]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menuStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: rect.bottom + 4,
        ...(align === 'right'
          ? { right: window.innerWidth - rect.right }
          : { left: rect.left }),
        zIndex: 9998,
      }
    : {};

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          triggerClassName ??
          'flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all active:scale-95 disabled:opacity-40 shrink-0'
        }
      >
        {trigger}
      </button>

      {open &&
        typeof document !== 'undefined' &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={menuStyle}
            className="min-w-[172px] rounded-2xl bg-background/95 backdrop-blur-xl border border-border/80 shadow-[0_8px_32px_rgba(44,26,20,0.12)] overflow-hidden"
          >
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-4 min-h-[44px] text-sm font-medium transition-all hover:bg-muted active:scale-95 disabled:opacity-40 ${item.className ?? 'text-foreground'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

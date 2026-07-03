import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSurface = 'light' | 'dark';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** `dark` — для розміщення поверх темної обкладинки (світлі *-300 тінти, ≥7:1 на #0F172A). */
  surface?: BadgeSurface;
  pulse?: boolean;
}

const onLight: Record<BadgeVariant, string> = {
  default: 'bg-secondary/60 text-text-sub',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  error:   'bg-destructive/12 text-destructive',
  info:    'bg-info/12 text-info',
};

const onDark: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/80',
  success: 'bg-emerald-400/12 text-emerald-200',
  warning: 'bg-amber-300/15 text-amber-200',
  error:   'bg-rose-400/15 text-rose-200',
  info:    'bg-indigo-400/15 text-indigo-200',
};

/**
 * Badge / піл (дизайн-мова). Тінт-піл для статусів. `surface="dark"` — коли піл живе на
 * темній обкладинці-герої (EditorialCover); інакше світлий варіант на periwinkle.
 */
export function Badge({ variant = 'default', surface = 'light', pulse = false, className, children, ...props }: BadgeProps) {
  const tones = surface === 'dark' ? onDark : onLight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        tones[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex size-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full size-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

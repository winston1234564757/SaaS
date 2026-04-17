'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BentoCardProps {
  title: string;
  metric: string;
  hint?: string;
  description?: string;
  icon: LucideIcon;
  statusColor?: 'success' | 'warning' | 'info' | 'error';
  onClick: () => void;
  className?: string;
  children?: ReactNode; // For mini-graphs or sparklines if needed later
}

const statusColors = {
  success: 'bg-[#5C9E7A]',
  warning: 'bg-[#D4935A]',
  info: 'bg-[#789A99]',
  error: 'bg-[#C05B5B]',
};

export function BentoCard({
  title,
  metric,
  hint,
  description,
  icon: Icon,
  statusColor = 'info',
  onClick,
  className,
  children
}: BentoCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'bento-card group flex flex-col p-6 text-left w-full h-full min-h-[160px]',
        'relative overflow-hidden cursor-pointer transition-all duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-[#6B5750] group-hover:bg-white/60 transition-colors">
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="flex items-center gap-2">
          {hint && (
            <span className="text-[11px] font-semibold text-[#6B5750]/60 uppercase tracking-wider">
              {hint}
            </span>
          )}
          <div className={cn('w-2 h-2 rounded-full', statusColors[statusColor])} />
        </div>
      </div>

      {/* Body */}
      <div className="mt-auto">
        <h3 className="text-[13px] font-medium text-[#6B5750] mb-0.5">{title}</h3>
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-bold text-[#2C1A14] tracking-tight">
            {metric}
          </span>
          {description && (
            <p className="text-[11px] leading-relaxed text-[#6B5750]/80 font-medium">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

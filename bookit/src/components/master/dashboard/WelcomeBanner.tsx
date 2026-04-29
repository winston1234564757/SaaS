'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ChevronRight, User2, FileText, Globe } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { Skeleton } from '@/components/ui/skeleton';

export function WelcomeBanner() {
  const { profile, masterProfile, isLoading } = useMasterContext();

  if (isLoading) {
    return (
      <div className="bento-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <Skeleton className="w-full h-1.5 rounded-full mb-3" />
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (!masterProfile) return null;

  const hasName = !!(profile?.full_name?.trim());
  const hasProfile = !!(masterProfile.bio && masterProfile.slug);
  const isPublished = masterProfile.is_published;

  if (hasName && hasProfile && isPublished) return null;

  const steps = [
    { done: hasName,      label: "Ім'я заповнено",        icon: User2 },
    { done: hasProfile,   label: 'Профіль та адреса',     icon: FileText },
    { done: isPublished,  label: 'Сторінка опублікована', icon: Globe },
  ];

  const completed = steps.filter(s => s.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="bento-card p-4"
      style={{ borderColor: 'rgba(120,154,153,0.2)', border: '1px solid rgba(120,154,153,0.2)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Налаштуй профіль</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">{completed}/3 кроків виконано</p>
        </div>
        <Link
          href="/dashboard/onboarding"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/90 transition-colors flex-shrink-0 bg-primary/10 px-3 py-1.5 rounded-xl"
        >
          Налаштувати <ChevronRight size={13} />
        </Link>
      </div>

      {/* Progress track */}
      <div className="w-full h-1.5 rounded-full bg-secondary/80 mb-3">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${(completed / 3) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {steps.map(({ done, label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                done ? 'bg-success' : 'bg-secondary/80'
              }`}
            >
              {done
                ? <Check size={9} className="text-white" strokeWidth={3} />
                : <Icon size={9} className="text-muted-foreground/60" />
              }
            </div>
            <span className={`text-xs transition-colors ${done ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

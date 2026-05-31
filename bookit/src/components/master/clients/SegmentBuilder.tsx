'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ChevronDown, Sparkles,
  Star, Crown, Gem, Heart, Zap, Target, TrendingUp, TrendingDown,
  AlertTriangle, Clock, UserCheck, UserX, Flame, Shield, Gift, Info,
} from 'lucide-react';
import { PopUpModal } from '@/components/ui/PopUpModal';
import { cn } from '@/lib/utils/cn';
import type { ClientRow } from './ClientsPage';
import type {
  CustomSegment, SegmentCondition, SegmentField, SegmentOperator,
} from '@/lib/types/segments';
import {
  SEGMENT_FIELD_LABELS, SEGMENT_OPERATOR_LABELS,
  OPERATORS_FOR_FIELD, SEGMENT_PRESET_COLORS, SEGMENT_PRESET_ICONS,
} from '@/lib/types/segments';
import { pluralUk } from '@/lib/utils/pluralUk';

// ── Icon map ──────────────────────────────────────────────────────────────────
export function getSegmentIcon(name: string, size = 14): React.ReactElement {
  const icons: Record<string, React.ReactElement> = {
    Star:          <Star size={size} />,
    Crown:         <Crown size={size} />,
    Gem:           <Gem size={size} />,
    Heart:         <Heart size={size} />,
    Zap:           <Zap size={size} />,
    Target:        <Target size={size} />,
    TrendingUp:    <TrendingUp size={size} />,
    TrendingDown:  <TrendingDown size={size} />,
    AlertTriangle: <AlertTriangle size={size} />,
    Clock:         <Clock size={size} />,
    UserCheck:     <UserCheck size={size} />,
    UserX:         <UserX size={size} />,
    Sparkles:      <Sparkles size={size} />,
    Flame:         <Flame size={size} />,
    Shield:        <Shield size={size} />,
    Gift:          <Gift size={size} />,
  };
  return icons[name] ?? <Star size={size} />;
}

// ── Client evaluator ──────────────────────────────────────────────────────────
export function evaluateCustomSegment(client: ClientRow, segment: CustomSegment): boolean {
  if (!segment.conditions.length) return false;
  let result = evalCond(client, segment.conditions[0]);
  for (let i = 1; i < segment.conditions.length; i++) {
    const join = segment.conditions[i - 1].joinNext ?? 'AND';
    const next = evalCond(client, segment.conditions[i]);
    result = join === 'AND' ? result && next : result || next;
  }
  return result;
}

function evalCond(client: ClientRow, cond: SegmentCondition): boolean {
  const { field, operator, value } = cond;
  if (field === 'is_vip') {
    return operator === 'eq' ? client.is_vip === (value === 'true') : client.is_vip !== (value === 'true');
  }
  if (field === 'retention_status') {
    if (operator === 'in')  return (value as string[]).includes(client.retention_status);
    if (operator === 'eq')  return client.retention_status === value;
    if (operator === 'neq') return client.retention_status !== value;
    return false;
  }
  let clientVal: number;
  if (field === 'days_since_last_visit') {
    if (!client.last_visit_at) return false;
    clientVal = Math.floor((Date.now() - new Date(client.last_visit_at).getTime()) / 86_400_000);
  } else {
    clientVal = client[field as keyof ClientRow] as number;
  }
  const threshold = Number(value);
  switch (operator) {
    case 'gt':  return clientVal > threshold;
    case 'gte': return clientVal >= threshold;
    case 'lt':  return clientVal < threshold;
    case 'lte': return clientVal <= threshold;
    case 'eq':  return clientVal === threshold;
    case 'neq': return clientVal !== threshold;
    default:    return false;
  }
}

// ── Field smart defaults ──────────────────────────────────────────────────────
const FIELD_DEFAULTS: Record<SegmentField, {
  operator: SegmentOperator;
  value: string | number | string[];
  hint: string;
  placeholder?: string;
}> = {
  retention_status:      { operator: 'in',  value: ['at_risk'],  hint: 'Статус розраховується автоматично на основі дати останнього візиту' },
  total_visits:          { operator: 'gte', value: 5,            hint: 'Загальна кількість відвідувань за весь час', placeholder: 'напр. 5' },
  total_spent:           { operator: 'gte', value: 3000,         hint: 'Сума всіх оплат у гривнях за весь час',      placeholder: 'напр. 3000' },
  average_check:         { operator: 'gte', value: 500,          hint: 'Середня сума оплати за один візит',          placeholder: 'напр. 500' },
  days_since_last_visit: { operator: 'gte', value: 30,           hint: 'Скільки днів пройшло з останнього візиту',   placeholder: 'напр. 30' },
  is_vip:                { operator: 'eq',  value: 'true',       hint: 'VIP-статус встановлюється вручну на картці клієнта' },
};

// ── Built-in templates ────────────────────────────────────────────────────────
interface SegmentTemplate {
  name: string;
  icon: string;
  color: string;
  hint: string;
  conditions: SegmentCondition[];
}

const TEMPLATES: SegmentTemplate[] = [
  {
    name: 'VIP під загрозою',
    icon: 'Crown', color: '#D4935A',
    hint: 'VIP-клієнти, які давно не приходили',
    conditions: [
      { field: 'is_vip',            operator: 'eq', value: 'true',              joinNext: 'AND' },
      { field: 'retention_status',  operator: 'in', value: ['at_risk', 'lost'] },
    ],
  },
  {
    name: 'Нові клієнти',
    icon: 'Sparkles', color: '#789A99',
    hint: 'Були лише один раз — треба утримати',
    conditions: [
      { field: 'total_visits', operator: 'eq', value: 1 },
    ],
  },
  {
    name: 'Кандидати в VIP',
    icon: 'Star', color: '#D4935A',
    hint: '5+ візитів або витратили ≥5000 ₴',
    conditions: [
      { field: 'total_visits', operator: 'gte', value: 5,    joinNext: 'OR' },
      { field: 'total_spent',  operator: 'gte', value: 5000 },
    ],
  },
  {
    name: 'Сплячі постійні',
    icon: 'Clock', color: '#A8896A',
    hint: 'Мінімум 3 візити, але не приходять',
    conditions: [
      { field: 'total_visits',     operator: 'gte', value: 3,           joinNext: 'AND' },
      { field: 'retention_status', operator: 'in',  value: ['sleeping'] },
    ],
  },
  {
    name: 'Чутливі до ціни',
    icon: 'Zap', color: '#789A99',
    hint: 'Середній чек до 500 ₴ — реагують на знижки',
    conditions: [
      { field: 'average_check', operator: 'lte', value: 500 },
    ],
  },
  {
    name: 'Топ-клієнти',
    icon: 'Gem', color: '#5C9E7A',
    hint: 'Найцінніша аудиторія: 10+ візитів або 15000+ ₴',
    conditions: [
      { field: 'total_visits', operator: 'gte', value: 10,    joinNext: 'OR' },
      { field: 'total_spent',  operator: 'gte', value: 15000 },
    ],
  },
  {
    name: 'Ризик новачків',
    icon: 'AlertTriangle', color: '#D4935A',
    hint: 'Перший візит + статус "під ризиком"',
    conditions: [
      { field: 'total_visits',     operator: 'eq', value: 1,          joinNext: 'AND' },
      { field: 'retention_status', operator: 'in', value: ['at_risk'] },
    ],
  },
  {
    name: 'Для архіву',
    icon: 'UserX', color: '#C05B5B',
    hint: 'Не приходили 4+ місяці',
    conditions: [
      { field: 'days_since_last_visit', operator: 'gte', value: 120 },
    ],
  },
];

// ── Status chips ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'active',   label: 'Активний',    color: '#5C9E7A' },
  { value: 'sleeping', label: 'Дрімає',      color: '#789A99' },
  { value: 'at_risk',  label: 'Під ризиком', color: '#D4935A' },
  { value: 'lost',     label: 'Втрачений',   color: '#C05B5B' },
];

// ── Condition row ─────────────────────────────────────────────────────────────
function ConditionRow({
  cond, index, total,
  onChange, onRemove, onToggleJoin,
}: {
  cond: SegmentCondition; index: number; total: number;
  onChange: (c: SegmentCondition) => void;
  onRemove: () => void;
  onToggleJoin: () => void;
}) {
  const operators   = OPERATORS_FOR_FIELD[cond.field];
  const isStatus    = cond.field === 'retention_status';
  const isVip       = cond.field === 'is_vip';
  const isNumeric   = !isStatus && !isVip;
  const hint        = FIELD_DEFAULTS[cond.field].hint;
  const placeholder = FIELD_DEFAULTS[cond.field].placeholder ?? '0';

  return (
    <div className="flex flex-col gap-2">
      <div className="p-4 rounded-2xl bg-secondary border border-border flex flex-col gap-3 shadow-sm">

        {/* Row 1: field selector + delete */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <select
              value={cond.field}
              onChange={e => {
                const f = e.target.value as SegmentField;
                const d = FIELD_DEFAULTS[f];
                onChange({ ...cond, field: f, operator: d.operator, value: d.value });
              }}
              className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl bg-muted/15 border border-transparent text-sm font-bold text-foreground outline-none focus:bg-secondary focus:border-accent/30 cursor-pointer truncate"
            >
              {(Object.keys(SEGMENT_FIELD_LABELS) as SegmentField[]).map(f => (
                <option key={f} value={f}>{SEGMENT_FIELD_LABELS[f]}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="size-9 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error/10 active:scale-[0.88] cursor-pointer transition-all shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Row 2: operator chips + numeric value */}
        {isNumeric && (
          <div className="flex items-center gap-2">
            {/* Operator chips — horizontal scroll */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0 pb-0.5">
              {operators.map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => onChange({ ...cond, operator: op })}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition-all',
                    cond.operator === op
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-muted/15 text-muted-foreground hover:bg-muted/30'
                  )}
                >
                  {SEGMENT_OPERATOR_LABELS[op]}
                </button>
              ))}
            </div>
            {/* Value */}
            <input
              type="number"
              value={cond.value as number | string}
              onChange={e => onChange({ ...cond, value: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder={placeholder}
              className="w-24 shrink-0 px-3 py-2 rounded-xl bg-muted/15 border border-transparent text-sm font-bold text-right outline-none focus:bg-secondary focus:border-accent/30"
            />
          </div>
        )}

        {/* VIP toggle */}
        {isVip && (
          <div className="flex gap-2">
            {[{ v: 'true', l: 'Клієнт є VIP' }, { v: 'false', l: 'Не є VIP' }].map(opt => (
              <button
                key={opt.v}
                type="button"
                onClick={() => onChange({ ...cond, value: opt.v })}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all',
                  cond.value === opt.v
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-muted/15 text-muted-foreground hover:bg-muted/30'
                )}
              >
                {opt.l}
              </button>
            ))}
          </div>
        )}

        {/* Status chips */}
        {isStatus && (
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(s => {
              const selected = Array.isArray(cond.value) && (cond.value as string[]).includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    const cur = Array.isArray(cond.value) ? cond.value as string[] : [];
                    onChange({ ...cond, value: selected ? cur.filter(x => x !== s.value) : [...cur, s.value] });
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all',
                    selected ? 'text-white shadow-sm' : 'bg-muted/15 text-muted-foreground hover:bg-muted/30'
                  )}
                  style={selected ? { background: s.color } : {}}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: selected ? 'rgba(255,255,255,0.5)' : s.color }}
                  />
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Hint */}
        <div className="flex items-start gap-1.5 pt-0.5 border-t border-muted/20">
          <Info size={11} className="text-muted-foreground/35 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground/45 leading-relaxed">{hint}</p>
        </div>
      </div>

      {/* AND/OR connector */}
      {index < total - 1 && (
        <div className="flex items-center gap-3 px-2 my-0.5">
          <div className="h-px flex-1 bg-muted-foreground/10" />
          <button
            type="button"
            onClick={onToggleJoin}
            className="px-3.5 py-1.5 rounded-xl bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest hover:bg-accent/20 active:scale-[0.88] cursor-pointer transition-all"
          >
            {cond.joinNext === 'OR' ? 'або' : 'і'}
          </button>
          <div className="h-px flex-1 bg-muted-foreground/10" />
        </div>
      )}
    </div>
  );
}

// ── SegmentBuilder ────────────────────────────────────────────────────────────
interface SegmentBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: CustomSegment | null;
  allClients: ClientRow[];
  onSave: (segment: CustomSegment) => void;
  onDelete?: (id: string) => void;
}

const blankCondition = (): SegmentCondition => {
  const d = FIELD_DEFAULTS.retention_status;
  return { field: 'retention_status', operator: d.operator, value: d.value, joinNext: 'AND' };
};

export function SegmentBuilder({
  isOpen, onClose, initial, allClients, onSave, onDelete,
}: SegmentBuilderProps) {
  const [name,       setName]       = useState(initial?.name        ?? '');
  const [icon,       setIcon]       = useState(initial?.icon        ?? 'Star');
  const [color,      setColor]      = useState(initial?.color       ?? SEGMENT_PRESET_COLORS[0]);
  const [conditions, setConditions] = useState<SegmentCondition[]>(
    initial?.conditions.length ? initial.conditions : [blankCondition()]
  );
  const [step,    setStep]    = useState<'template' | 'edit'>(initial ? 'edit' : 'template');
  const [showIcons, setShowIcons] = useState(false);

  // Reset when initial changes
  const [lastId, setLastId] = useState(initial?.id);
  if (initial?.id !== lastId) {
    setLastId(initial?.id);
    setName(initial?.name ?? '');
    setIcon(initial?.icon ?? 'Star');
    setColor(initial?.color ?? SEGMENT_PRESET_COLORS[0]);
    setConditions(initial?.conditions.length ? initial.conditions : [blankCondition()]);
    setStep(initial ? 'edit' : 'template');
  }

  const applyTemplate = (t: SegmentTemplate) => {
    setName(t.name);
    setIcon(t.icon);
    setColor(t.color);
    setConditions(t.conditions.map(c => ({ ...c })));
    setStep('edit');
  };

  const matchCount = useMemo(() => {
    if (!conditions.length) return 0;
    const seg: CustomSegment = { id: '', name, icon, color, conditions };
    return allClients.filter(c => evaluateCustomSegment(c, seg)).length;
  }, [conditions, allClients, name, icon, color]);

  const updateCondition = (i: number, c: SegmentCondition) =>
    setConditions(prev => prev.map((x, idx) => idx === i ? c : x));

  const toggleJoin = (i: number) =>
    setConditions(prev => prev.map((c, idx) =>
      idx === i ? { ...c, joinNext: c.joinNext === 'AND' ? 'OR' : 'AND' } : c
    ));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: initial?.id ?? crypto.randomUUID(), name: name.trim(), icon, color, conditions });
    onClose();
  };

  const isValid = name.trim().length > 0 && conditions.length > 0 &&
    conditions.every(c =>
      c.field === 'is_vip' ? true :
      c.field === 'retention_status' ? (Array.isArray(c.value) && c.value.length > 0) :
      c.value !== '' && c.value !== 0
    );

  return (
    <PopUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'template' ? 'Оберіть шаблон або створіть свій' : (initial ? 'Редагувати сегмент' : 'Новий сегмент')}
    >
      <AnimatePresence mode="popLayout">

        {/* ── Step 1: Template picker ── */}
        {step === 'template' && (
          <motion.div
            key="template"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-5 pb-4"
          >
            <p className="text-xs text-muted-foreground/60 -mt-1">
              Оберіть готовий шаблон — умови заповняться автоматично. Після цього можна відредагувати.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {TEMPLATES.map(t => (
                <motion.button
                  key={t.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => applyTemplate(t)}
                  className="flex flex-col gap-2 p-3.5 rounded-2xl border border-border bg-secondary/60 hover:bg-secondary text-left transition-all active:scale-[0.95] cursor-pointer"
                >
                  <div
                    className="size-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${t.color}18`, color: t.color }}
                  >
                    {getSegmentIcon(t.icon, 16)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-tight">{t.hint}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-muted-foreground/10" />
              <span className="text-[10px] text-muted-foreground/40 font-medium">або</span>
              <div className="h-px flex-1 bg-muted-foreground/10" />
            </div>

            <button
              onClick={() => setStep('edit')}
              className="w-full py-3.5 rounded-2xl border border-dashed border-accent/30 text-accent text-sm font-bold hover:bg-accent/5 active:scale-[0.95] cursor-pointer transition-all"
            >
              + Створити з нуля
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Editor ── */}
        {step === 'edit' && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-5 pb-4"
          >
            {/* Name + icon preview */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowIcons(v => !v)}
                className="size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-[0.88] cursor-pointer"
                style={{ background: `${color}20`, color }}
              >
                {getSegmentIcon(icon, 20)}
              </button>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Назва сегмента..."
                className="flex-1 px-4 py-3 rounded-2xl bg-secondary border border-border focus:border-accent/40 focus:ring-2 focus:ring-accent/10 outline-none text-sm font-bold"
                autoFocus={step === 'edit' && !initial}
              />
            </div>

            {/* Icon + color (collapsible) */}
            <AnimatePresence>
              {showIcons && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-muted/10 border border-muted/20">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Іконка</p>
                      <div className="grid grid-cols-8 gap-2">
                        {SEGMENT_PRESET_ICONS.map(ic => (
                          <button
                            key={ic} type="button"
                            onClick={() => { setIcon(ic); setShowIcons(false); }}
                            className={cn(
                              'size-9 rounded-xl flex items-center justify-center active:scale-[0.88] cursor-pointer transition-all',
                              icon === ic
                                ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-md'
                                : 'bg-secondary border border-border text-muted-foreground/50 hover:text-foreground'
                            )}
                          >
                            {getSegmentIcon(ic, 15)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Колір</p>
                      <div className="flex gap-2">
                        {SEGMENT_PRESET_COLORS.map(c => (
                          <button
                            key={c} type="button"
                            onClick={() => setColor(c)}
                            className={cn('size-8 rounded-xl active:scale-[0.88] cursor-pointer transition-all', color === c ? 'ring-2 ring-offset-2 ring-foreground/30 scale-110' : 'hover:scale-105')}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Умови фільтрації</p>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: `${color}15`, color }}
                >
                  <span>{matchCount}</span>
                  <span className="opacity-70">{pluralUk(matchCount, 'клієнт', 'клієнти', 'клієнтів')} відповідають</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <AnimatePresence initial={false}>
                  {conditions.map((cond, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ConditionRow
                        cond={cond} index={i} total={conditions.length}
                        onChange={c => updateCondition(i, c)}
                        onRemove={() => setConditions(prev => prev.filter((_, idx) => idx !== i))}
                        onToggleJoin={() => toggleJoin(i)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setConditions(prev => [...prev, blankCondition()])}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-dashed border-accent/25 text-accent text-xs font-bold hover:bg-accent/5 active:scale-[0.88] cursor-pointer transition-all mt-1"
                >
                  <Plus size={13} /> Додати умову
                </button>
              </div>
            </div>

            {/* Empty conditions hint */}
            {conditions.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/5 border border-warning/10">
                <Info size={13} className="text-warning shrink-0" />
                <p className="text-xs text-warning/80">Додайте хоча б одну умову для збереження</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!initial && (
                <button
                  type="button"
                  onClick={() => setStep('template')}
                  className="px-4 py-3.5 rounded-2xl bg-muted/20 text-muted-foreground text-sm font-bold hover:bg-muted/30 active:scale-[0.95] cursor-pointer transition-all"
                >
                  Шаблони
                </button>
              )}
              {initial && onDelete && (
                <button
                  type="button"
                  onClick={() => { onDelete(initial.id); onClose(); }}
                  className="px-4 py-3.5 rounded-2xl bg-error/5 text-error text-sm font-bold hover:bg-error/10 active:scale-[0.95] cursor-pointer transition-all"
                >
                  Видалити
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-sm font-bold disabled:opacity-40 hover:opacity-90 active:scale-[0.95] cursor-pointer transition-all"
              >
                {matchCount > 0
                  ? `Зберегти · ${matchCount} ${pluralUk(matchCount, 'клієнт', 'клієнти', 'клієнтів')}`
                  : 'Зберегти'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </PopUpModal>
  );
}

'use client';

import { BarChart3, Check } from 'lucide-react';

const FEATURES = [
  'Оренда, комунальні, інструменти, реклама, навчання',
  'Графік витрат по місяцях',
  'Рентабельність кожної послуги',
  'Порівняння з минулим місяцем',
];

export function ExpensesTab() {
  return (
    <div className="flex flex-col items-center gap-6 py-12 px-6 text-center max-w-md mx-auto">
      <div className="size-20 rounded-[28px] bg-primary/8 border border-primary/15 flex items-center justify-center">
        <BarChart3 size={36} className="text-primary/50" />
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold uppercase tracking-wider mb-3">
          Незабаром
        </div>
        <h2 className="heading-serif text-2xl text-foreground mb-2">Операційні витрати</h2>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">
          Деталізований облік всіх витрат бізнесу — від оренди до реклами. Побачите повну картину прибутковості.
        </p>
      </div>

      <ul className="text-left flex flex-col gap-3 w-full">
        {FEATURES.map(f => (
          <li key={f} className="flex items-start gap-3">
            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Check size={11} className="text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

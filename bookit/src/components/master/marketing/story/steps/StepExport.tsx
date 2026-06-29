'use client';

interface StepExportProps {
  isPremiumLocked: boolean;
  children: React.ReactNode; // кнопка завантаження з оркестратора
}

export function StepExport({ isPremiumLocked, children }: StepExportProps) {
  return (
    <div className="space-y-3">
      <div className="text-center space-y-1 pt-1">
        <p className="text-sm font-semibold text-foreground">Сторіс готова</p>
        <p className="text-xs text-muted-foreground/70">
          {isPremiumLocked
            ? 'Це PRO-шаблон. Оновіть тариф, щоб зберегти.'
            : 'Завантаж і додай у свої Instagram Stories.'}
        </p>
      </div>
      {children}
    </div>
  );
}

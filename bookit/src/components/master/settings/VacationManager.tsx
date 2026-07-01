'use client';

import { useTimeOff } from '@/lib/supabase/hooks/useTimeOff';
import type { Schedule, DayKey } from './hooks/useSettingsForm';
import { VacationManagerView } from './widgets/VacationManagerView';

interface VacationManagerProps {
  schedule: Schedule;
  onScheduleChange: (schedule: Schedule) => void;
}

/** Container: wires time-off data + weekly-schedule toggles into the presentational view. */
export function VacationManager({ schedule, onScheduleChange }: VacationManagerProps) {
  const { entries, isLoading, add, remove, isAdding, addError } = useTimeOff();

  const onToggleDay = (day: DayKey) =>
    onScheduleChange({ ...schedule, [day]: { ...schedule[day], is_working: !schedule[day].is_working } });

  return (
    <VacationManagerView
      schedule={schedule}
      onToggleDay={onToggleDay}
      entries={entries}
      isLoading={isLoading}
      onAdd={add}
      onRemove={remove}
      isAdding={isAdding}
      addError={addError}
    />
  );
}

'use client';

import { TodaySchedule } from '../TodaySchedule';
import { motion } from 'framer-motion';

export function ScheduleWidget() {
  return (
    <div className="h-full flex flex-col">
      {/* We reuse the existing TodaySchedule but wrapped for bento */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <TodaySchedule />
      </div>
    </div>
  );
}

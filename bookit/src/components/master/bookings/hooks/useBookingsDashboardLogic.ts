'use client';

import { useMemo } from 'react';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useMasterContext } from '@/lib/supabase/context';
import { toMins } from '@/lib/utils/smartSlots';
import { isSameDay, parseISO, differenceInMinutes } from 'date-fns';

export interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  forecastRevenue: number;
  occupancyRate: number;
  retentionRate: number;
  returningClientsCount: number;
  newClientsCount: number;
  lostMinutes: number;
  efficiencyRate: number;
}

export function useBookingsDashboardLogic(dateFrom: string, dateTo: string) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const { bookings, isLoading: isBookingsLoading } = useBookings(dateFrom, dateTo);
  const { data: schedule, isLoading: isScheduleLoading } = useWizardSchedule(masterId, dateFrom, dateTo);

  const stats = useMemo<DashboardStats>(() => {
    if (!bookings) return {
      totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, completedBookings: 0, cancelledBookings: 0,
      totalRevenue: 0, forecastRevenue: 0, occupancyRate: 0, retentionRate: 0, returningClientsCount: 0,
      newClientsCount: 0, lostMinutes: 0, efficiencyRate: 0
    };

    // 1. Basic Counts & Revenue
    const completed = bookings.filter(b => b.status === 'completed');
    const pending = bookings.filter(b => b.status === 'pending');
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');

    const totalRevenue = completed.reduce((sum, b) => sum + b.total_price, 0);
    const forecastRevenue = (confirmed.length + pending.length) > 0 
      ? [...confirmed, ...pending].reduce((sum, b) => sum + b.total_price, 0)
      : 0;

    // 2. Retention (Simple logic based on booking history in the current set)
    // Note: In a real scenario, this would check the global client_master_relations
    // For now, we'll use a simplified version: if client appears > 1 time or we have access to context
    // Actually, we'll just placeholder this until we have a better way or keep it simple.
    const clientMap = new Map<string, number>();
    bookings.forEach(b => {
      const count = clientMap.get(b.client_phone) ?? 0;
      clientMap.set(b.client_phone, count + 1);
    });
    
    const returningClientsCount = Array.from(clientMap.values()).filter(v => v > 1).length;
    const newClientsCount = clientMap.size - returningClientsCount;
    const retentionRate = clientMap.size > 0 ? (returningClientsCount / clientMap.size) * 100 : 0;

    // 3. Occupancy & Efficiency
    let totalWorkingMinutes = 0;
    if (schedule) {
      const start = parseISO(dateFrom);
      const end = parseISO(dateTo);
      
      // Iterate through days in range
      let current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][current.getDay()];
        
        const exception = schedule.exceptions[dateStr];
        const template = schedule.templates[dayOfWeek];

        let dayStart: string | null = null;
        let dayEnd: string | null = null;
        let isDayOff = false;

        if (exception) {
          isDayOff = exception.is_day_off;
          dayStart = exception.start_time;
          dayEnd = exception.end_time;
        } else if (template) {
          isDayOff = !template.is_working;
          dayStart = template.start_time;
          dayEnd = template.end_time;
        }

        if (!isDayOff && dayStart && dayEnd) {
          const duration = toMins(dayEnd) - toMins(dayStart);
          // Subtract breaks if any
          const brkStart = template?.break_start;
          const brkEnd = template?.break_end;
          const breakDuration = (brkStart && brkEnd) ? (toMins(brkEnd) - toMins(brkStart)) : 0;
          
          totalWorkingMinutes += Math.max(0, duration - breakDuration);
        }
        current.setDate(current.getDate() + 1);
      }
    }

    const totalBookedMinutes = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => {
        const d = toMins(b.end_time) - toMins(b.start_time);
        return sum + Math.max(0, d);
      }, 0);

    const lostMinutes = cancelled.reduce((sum, b) => {
      const d = toMins(b.end_time) - toMins(b.start_time);
      return sum + Math.max(0, d);
    }, 0);

    const occupancyRate = totalWorkingMinutes > 0 ? (totalBookedMinutes / totalWorkingMinutes) * 100 : 0;
    const efficiencyRate = totalWorkingMinutes > 0 ? ((totalBookedMinutes - lostMinutes) / totalWorkingMinutes) * 100 : 0;

    return {
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      pendingBookings: pending.length,
      completedBookings: completed.length,
      cancelledBookings: cancelled.length,
      totalRevenue,
      forecastRevenue,
      occupancyRate,
      retentionRate,
      returningClientsCount,
      newClientsCount,
      lostMinutes,
      efficiencyRate
    };
  }, [bookings, schedule, dateFrom, dateTo]);

  return {
    stats,
    isLoading: isBookingsLoading || isScheduleLoading,
    bookings,
  };
}

/**
 * Date utility functions for PREVENIA.
 * Treats LocalDate (YYYY-MM-DD) strings cleanly without timezone drifting.
 */

export function formatDateSpanish(dateString?: string | null): string {
  if (!dateString) return '—';

  // If format is YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2].substring(0, 2);
    return `${day}/${month}/${year}`;
  }

  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateTimeSpanish(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatDaysUntilExpiration(days?: number | null): string {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days > 1) return `Vence en ${days} días`;
  if (days === -1) return 'Venció ayer';
  return `Venció hace ${Math.abs(days)} días`;
}

export const getDaysUntilLabel = formatDaysUntilExpiration;

export const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const WEEKDAYS_SHORT_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function toIsoDateString(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function getTodayIso(): string {
  const now = new Date();
  return toIsoDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export interface CalendarDay {
  dateString: string; // 'YYYY-MM-DD'
  dayNumber: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Builds a 35 or 42 day grid for month calendar view starting on Monday (Lunes)
 */
export function buildMonthCalendarGrid(year: number, month: number): {
  days: CalendarDay[];
  startDateIso: string;
  endDateIso: string;
} {
  const todayIso = getTodayIso();
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);

  // Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // We want Monday = 0, Sunday = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const daysInCurrentMonth = lastDayOfMonth.getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateString = toIsoDateString(prevYear, prevMonth, dayNum);
    days.push({
      dateString,
      dayNumber: dayNum,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: dateString === todayIso,
      isWeekend: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateString = toIsoDateString(year, month, d);
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    days.push({
      dateString,
      dayNumber: d,
      month,
      year,
      isCurrentMonth: true,
      isToday: dateString === todayIso,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  // Next month leading days to fill up to 35 or 42 grid
  const totalSlots = days.length > 35 ? 42 : 35;
  const nextMonthLeading = totalSlots - days.length;
  for (let d = 1; d <= nextMonthLeading; d++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const dateString = toIsoDateString(nextYear, nextMonth, d);
    days.push({
      dateString,
      dayNumber: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: dateString === todayIso,
      isWeekend: false,
    });
  }

  return {
    days,
    startDateIso: days[0].dateString,
    endDateIso: days[days.length - 1].dateString,
  };
}

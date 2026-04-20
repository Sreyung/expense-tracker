import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export function toUnixMs(date: Date): number {
  return date.getTime();
}

export function fromUnixMs(ms: number): Date {
  return new Date(ms);
}

export function monthRange(year: number, month: number): { start: number; end: number } {
  const date = new Date(year, month - 1, 1);
  return {
    start: toUnixMs(startOfMonth(date)),
    end: toUnixMs(endOfMonth(date)),
  };
}

export function formatDate(ms: number, fmt = 'dd MMM yyyy'): string {
  return format(fromUnixMs(ms), fmt);
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy');
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

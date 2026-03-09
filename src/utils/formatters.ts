import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

const parseDateSafe = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = trimmed.includes('T') ? parseISO(trimmed) : new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (date?: string | Date | null): string => {
  const parsed = parseDateSafe(date);
  if (!parsed) return '--';
  if (isToday(parsed)) return 'Today';
  if (isTomorrow(parsed)) return 'Tomorrow';
  return format(parsed, 'dd MMM yyyy');
};

export const formatTime = (time?: string | Date | null): string => {
  const parsed = parseDateSafe(time);
  if (!parsed) return '--';
  return format(parsed, 'hh:mm a');
};

export const formatDateTime = (date?: string | Date | null): string => {
  const parsed = parseDateSafe(date);
  if (!parsed) return '--';
  return format(parsed, 'dd MMM yyyy, hh:mm a');
};

export const formatRelativeTime = (date?: string | Date | null): string => {
  const parsed = parseDateSafe(date);
  if (!parsed) return '--';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  return phone;
};

export const getInitials = (name: string): string => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

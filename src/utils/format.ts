const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** "Friday, 2 October 2026" */
export function formatLongDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "08:15 AM", or "08:15:09 AM" with seconds. */
export function formatTime(d: Date, withSeconds = false): string {
  const h = d.getHours() % 12 || 12;
  const suffix = d.getHours() < 12 ? 'AM' : 'PM';
  const secs = withSeconds ? `:${pad(d.getSeconds())}` : '';
  return `${pad(h)}:${pad(d.getMinutes())}${secs} ${suffix}`;
}

/** Formats a server ISO-8601 timestamp; returns "—" if missing or invalid. */
export function formatServerTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : formatTime(d);
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function getMonthName(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

export function toDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export function getDayLabel(dayIndex: number): string {
  return DAY_LABELS[dayIndex];
}

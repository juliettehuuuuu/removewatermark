export function getIsoTimestr(): string {
  return new Date().toISOString();
}

export function getOneYearLaterTimestr(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

export function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function formatTimeForDisplay(isoString: string): string {
  return new Date(isoString).toLocaleString();
} 
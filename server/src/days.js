const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function countDays(dateFrom, dateTo) {
  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);
  if (!from || !to) return 0;
  return Math.round((to - from) / MS_PER_DAY) + 1;
}

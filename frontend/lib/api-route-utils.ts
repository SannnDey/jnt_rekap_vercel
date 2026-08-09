export const parseDateString = (value: string, endOfDay = false): Date => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${value}`);
  }
  const date = new Date(year, month - 1, day);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

export const buildDateRangeFilter = (
  startDate: string | null,
  endDate: string | null,
  fieldName = 'tanggal'
) => {
  if (!startDate && !endDate) {
    return undefined;
  }

  const range: any = {};
  if (startDate) {
    range.gte = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
      ? parseDateString(startDate)
      : new Date(startDate);
  }
  if (endDate) {
    range.lte = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
  }

  return { [fieldName]: range };
};

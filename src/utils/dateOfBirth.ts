export function getDaysInMonth(month: string, year: string | number): number {
  if (!month || !year) return 31;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = months.indexOf(month);
  if (monthIndex === -1) return 31;

  const numericYear = typeof year === "string" ? parseInt(year, 10) : year;
  return new Date(numericYear, monthIndex + 1, 0).getDate();
}

export function generateYears(range: number = 100): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => currentYear - i);
}

export function getMonths(): string[] {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
}

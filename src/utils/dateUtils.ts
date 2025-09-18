import { MONTHS } from "@/constants/onboarding";

/**
 * Get the number of days in a given month and year
 */
export const getDaysInMonth = (month: string, year: string): number => {
  if (!month || !year) return 31; // Default to 31 days if month/year not selected

  const monthIndex = MONTHS.indexOf(month as any);
  if (monthIndex === -1) return 31;

  return new Date(parseInt(year), monthIndex + 1, 0).getDate();
};

/**
 * Get months array for dropdowns
 */
export const getMonths = (): string[] => {
  return [...MONTHS];
};

/**
 * Generate years array going back from current year
 */
export const generateYears = (yearsBack: number = 100): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: yearsBack }, (_, i) => currentYear - i);
};

/**
 * Format work experience date range
 */
export const formatDateRange = (
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string
): string => {
  const sm = startMonth || "–";
  const sy = startYear || "–";
  const em = endMonth || "–";
  const ey = endYear || "–";
  return `${sm} ${sy} → ${em} ${ey}`;
};

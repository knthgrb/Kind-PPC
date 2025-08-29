// Onboarding form constants

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const TIME_SLOTS = ["Morning", "Afternoon", "Evening"] as const;

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

export const LOCATION_OPTIONS = [
  "Philippines",
  "USA",
  "UK",
  "Canada",
  "India",
] as const;

export const DOCUMENT_TYPES = [
  "National ID",
  "Passport",
  "Driver's License",
  "SSS / UMID",
  "TIN",
] as const;

export const MONTHS = [
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
] as const;

// Generate years from current year backwards
export const generateYears = (count: number = 100): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => currentYear - i);
};

// Recent years for work history (last 10 years)
export const WORK_HISTORY_YEARS = generateYears(10).map(String);

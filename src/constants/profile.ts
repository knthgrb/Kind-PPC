export const GET_MONTHS = () => [
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

export const GET_YEARS = () => ["2025", "2024", "2023", "2022", "2021", "2020"];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type Day = (typeof DAYS)[number];
export const GET_ALL_DAYS = (): Day[] => [...DAYS];

export const GET_TIME_SLOTS = () => ["Morning", "Afternoon", "Evening"];

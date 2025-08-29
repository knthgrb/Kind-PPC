import {
  DAYS_OF_WEEK,
  TIME_SLOTS,
  GENDER_OPTIONS,
  LOCATION_OPTIONS,
  DOCUMENT_TYPES,
} from "@/constants/onboarding";

// Personal Information Types
export interface PersonalInfoForm {
  day: string;
  month: string;
  year: string;
  gender: (typeof GENDER_OPTIONS)[number];
  location: (typeof LOCATION_OPTIONS)[number];
}

// Skills & Availability Types
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export type TimeSlot = (typeof TIME_SLOTS)[number];

export interface SkillsAvailabilityForm {
  skills: string[];
  selectedDays: DayOfWeek[];
  timeSlot: TimeSlot;
  slotMorning: boolean;
  slotEvening: boolean;
}

// Work History Types
export interface WorkEntry {
  jobTitle: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  description: string;
  expanded?: boolean;
}

// Document Upload Types
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentUploadForm {
  docType: DocumentType;
  file: File | null;
  preview: string | null;
}

// Modal Props Type
export interface ModalProps {
  title: string;
  description: string;
  buttonLabel: string;
  icon?: string | null;
  onAction: () => void;
}

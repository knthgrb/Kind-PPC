export type SalaryRate = "Per Hour" | "Per Day" | "Per Week" | "Per Month";
export type JobType =
  | "yaya"
  | "driver"
  | "housekeeper"
  | "caregiver"
  | "cook"
  | "all_around";

export type JobPostInput = {
  family_id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  salary_rate: SalaryRate;
};

export type JobPost = {
  id: string;
  family_id: string;
  title: string;
  description: string;
  job_type: JobType | null;
  location: string;
  salary_min: number;
  salary_max: number;
  salary_rate: SalaryRate;
  created_at: string;
  updated_at: string;
};

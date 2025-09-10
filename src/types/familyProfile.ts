export interface FamilyProfile {
  id: string;
  user_id: string;
  household_size: number | null;
  children_count: number;
  children_ages: number[];
  elderly_count: number;
  pets_count: number;
  pet_types: string[];
  preferred_languages: string[];
  household_description: string | null;
  special_requirements: string | null;
  work_environment_description: string | null;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyProfileFormData {
  household_size: number | string;
  children_count: number;
  children_ages: number[];
  elderly_count: number;
  pets_count: number;
  pet_types: string[];
  preferred_languages: string[];
  household_description: string;
  special_requirements: string;
  work_environment_description: string;
}

export interface FamilyOnboardingStage {
  name: string;
  path: string;
  completed: boolean;
}

export interface FamilyOnboardingProgress {
  isComplete: boolean;
  nextStage?: string;
  completedStages: string[];
  missingStages: string[];
}



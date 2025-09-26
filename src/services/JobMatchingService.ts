import { createClient } from "@/utils/supabase/server";
import { createClient as createClientClient } from "@/utils/supabase/client";
import { JobPost } from "@/types/jobPosts";

export interface HelperProfile {
  id: string;
  user_id: string;
  skills: string[];
  experience_years: number;
  preferred_job_types: string[];
  languages_spoken: string[];
  salary_expectation_min: number | null;
  salary_expectation_max: number | null;
  availability_schedule: any;
  is_available_live_in: boolean;
  preferred_work_radius: number;
  bio: string | null;
  educational_background: string | null;
  certifications: string[] | null;
  portfolio_images: string[] | null;
  rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  response_rate: number;
  last_active: string;
  work_experience: any[] | null;
  location_preference: string[] | null;
}

export interface MatchingScore {
  jobId: string;
  score: number;
  reasons: string[];
  breakdown: {
    jobTypeMatch: number;
    locationMatch: number;
    salaryMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    availabilityMatch: number;
    ratingBonus: number;
    recencyBonus: number;
  };
}

export interface JobWithMatchingScore extends JobPost {
  matchingScore: MatchingScore;
}

export class JobMatchingService {
  /**
   * Get helper profile by user ID
   */
  static async getHelperProfile(userId: string): Promise<HelperProfile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("helper_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching helper profile:", error);
      return null;
    }

    return data;
  }

  /**
   * Calculate matching score between a job and helper profile
   */
  static calculateMatchingScore(
    job: JobPost,
    profile: HelperProfile
  ): MatchingScore {
    const reasons: string[] = [];
    const breakdown = {
      jobTypeMatch: 0,
      locationMatch: 0,
      salaryMatch: 0,
      skillsMatch: 0,
      experienceMatch: 0,
      availabilityMatch: 0,
      ratingBonus: 0,
      recencyBonus: 0,
    };

    let totalScore = 0;

    // 1. Job Type Match (25% weight)
    if (job.job_type && profile.preferred_job_types?.includes(job.job_type)) {
      breakdown.jobTypeMatch = 25;
      reasons.push(`Perfect job type match: ${job.job_type}`);
    } else if (job.job_type && profile.preferred_job_types?.length) {
      // Partial match based on similar job types
      const similarTypes = this.getSimilarJobTypes(
        job.job_type,
        profile.preferred_job_types
      );
      breakdown.jobTypeMatch = similarTypes * 15;
      if (similarTypes > 0) {
        reasons.push(`Similar job type match: ${(similarTypes * 100).toFixed(2)}%`);
      }
    }
    totalScore += breakdown.jobTypeMatch;

    // 2. Location Match (20% weight)
    if (job.location && profile.location_preference?.length) {
      const locationMatch = this.calculateLocationMatch(
        job.location,
        profile.location_preference
      );
      breakdown.locationMatch = locationMatch * 20;
      if (locationMatch > 0) {
        reasons.push(
          `Location preference match: ${Math.round(locationMatch * 100)}%`
        );
      }
    }
    totalScore += breakdown.locationMatch;

    // 3. Salary Match (15% weight)
    if (
      job.salary_min &&
      job.salary_max &&
      profile.salary_expectation_min &&
      profile.salary_expectation_max
    ) {
      const salaryMatch = this.calculateSalaryMatch(
        job.salary_min,
        job.salary_max,
        profile.salary_expectation_min,
        profile.salary_expectation_max
      );
      breakdown.salaryMatch = salaryMatch * 15;
      if (salaryMatch > 0) {
        reasons.push(
          `Salary expectation match: ${Math.round(salaryMatch * 100)}%`
        );
      }
    }
    totalScore += breakdown.salaryMatch;

    // 4. Skills Match (15% weight)
    if (profile.skills?.length) {
      const skillsMatch = this.calculateSkillsMatch(job, profile.skills);
      breakdown.skillsMatch = skillsMatch * 15;
      if (skillsMatch > 0) {
        reasons.push(`Skills match: ${Math.round(skillsMatch * 100)}%`);
      }
    }
    totalScore += breakdown.skillsMatch;

    // 5. Experience Match (10% weight)
    if (profile.experience_years > 0) {
      const experienceMatch = this.calculateExperienceMatch(
        job,
        profile.experience_years
      );
      breakdown.experienceMatch = experienceMatch * 10;
      if (experienceMatch > 0) {
        reasons.push(
          `Experience level match: ${Math.round(experienceMatch * 100)}%`
        );
      }
    }
    totalScore += breakdown.experienceMatch;

    // 6. Availability Match (10% weight)
    if (profile.availability_schedule) {
      const availabilityMatch = this.calculateAvailabilityMatch(
        job,
        profile.availability_schedule
      );
      breakdown.availabilityMatch = availabilityMatch * 10;
      if (availabilityMatch > 0) {
        reasons.push(
          `Availability match: ${Math.round(availabilityMatch * 100)}%`
        );
      }
    }
    totalScore += breakdown.availabilityMatch;

    // 7. Rating Bonus (3% weight)
    if (profile.rating > 0) {
      breakdown.ratingBonus = Math.min((profile.rating / 5) * 3, 3);
      if (profile.rating >= 4.5) {
        reasons.push(`High rating: ${profile.rating}/5`);
      } else if (profile.rating >= 4.0) {
        reasons.push(`Good rating: ${profile.rating}/5`);
      }
    }
    totalScore += breakdown.ratingBonus;

    // 8. Recency Bonus (2% weight)
    const lastActive = new Date(profile.last_active);
    const daysSinceActive =
      (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive <= 1) {
      breakdown.recencyBonus = 2;
      reasons.push("Recently active");
    } else if (daysSinceActive <= 7) {
      breakdown.recencyBonus = 1;
      reasons.push("Active this week");
    }
    totalScore += breakdown.recencyBonus;

    return {
      jobId: job.id,
      score: Math.min(Math.round(totalScore), 100),
      reasons,
      breakdown,
    };
  }

  /**
   * Get similar job types
   */
  private static getSimilarJobTypes(
    jobType: string,
    preferredTypes: string[]
  ): number {
    const jobTypeGroups = {
      yaya: ["caregiver", "housekeeper"],
      caregiver: ["yaya", "housekeeper"],
      housekeeper: ["yaya", "caregiver", "cook"],
      cook: ["housekeeper"],
      driver: ["all_around"],
      all_around: ["driver", "housekeeper", "cook"],
    };

    const similarTypes =
      jobTypeGroups[jobType as keyof typeof jobTypeGroups] || [];
    const matches = preferredTypes.filter((type) =>
      similarTypes.includes(type)
    );
    return matches.length / similarTypes.length;
  }

  /**
   * Calculate location match
   */
  private static calculateLocationMatch(
    jobLocation: string,
    preferredLocations: string[]
  ): number {
    const jobLocationLower = jobLocation.toLowerCase();

    // Exact match
    if (
      preferredLocations.some((loc) => loc.toLowerCase() === jobLocationLower)
    ) {
      return 1.0;
    }

    // City-level match (e.g., "Cebu City" matches "Cebu")
    const jobCity = jobLocationLower.split(" ")[0];
    if (preferredLocations.some((loc) => loc.toLowerCase().includes(jobCity))) {
      return 0.8;
    }

    // Province/region match
    const majorCities = {
      cebu: ["cebu city", "mandaue", "lapu-lapu", "talisay", "minglanilla"],
      davao: ["davao city", "tagum", "panabo"],
      manila: ["manila", "quezon city", "makati", "taguig"],
      cagayan: ["cagayan de oro", "iligan", "ozamiz"],
    };

    for (const [region, cities] of Object.entries(majorCities)) {
      if (
        jobLocationLower.includes(region) ||
        cities.some((city) => jobLocationLower.includes(city))
      ) {
        if (
          preferredLocations.some(
            (loc) =>
              loc.toLowerCase().includes(region) ||
              cities.some((city) => loc.toLowerCase().includes(city))
          )
        ) {
          return 0.6;
        }
      }
    }

    return 0;
  }

  /**
   * Calculate salary match
   */
  private static calculateSalaryMatch(
    jobMin: number,
    jobMax: number,
    profileMin: number,
    profileMax: number
  ): number {
    const jobMid = (jobMin + jobMax) / 2;
    const profileMid = (profileMin + profileMax) / 2;

    // Perfect overlap
    if (jobMin >= profileMin && jobMax <= profileMax) {
      return 1.0;
    }

    // Partial overlap
    if (jobMin <= profileMax && jobMax >= profileMin) {
      const overlap =
        Math.min(jobMax, profileMax) - Math.max(jobMin, profileMin);
      const totalRange =
        Math.max(jobMax, profileMax) - Math.min(jobMin, profileMin);
      return overlap / totalRange;
    }

    // No overlap - check how close
    const distance = Math.min(
      Math.abs(jobMin - profileMax),
      Math.abs(jobMax - profileMin)
    );
    const maxRange = Math.max(jobMax - jobMin, profileMax - profileMin);

    // If within 20% of the range, give some points
    if (distance <= maxRange * 0.2) {
      return 0.3;
    }

    return 0;
  }

  /**
   * Calculate skills match
   */
  private static calculateSkillsMatch(job: JobPost, skills: string[]): number {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const relevantSkills = skills.filter((skill) =>
      jobText.includes(skill.toLowerCase())
    );
    return relevantSkills.length / skills.length;
  }

  /**
   * Calculate experience match
   */
  private static calculateExperienceMatch(
    job: JobPost,
    experienceYears: number
  ): number {
    const jobText = `${job.title} ${job.description}`.toLowerCase();

    // Look for experience requirements in job description
    const experienceKeywords = [
      "experienced",
      "senior",
      "expert",
      "professional",
      "skilled",
    ];
    const hasExperienceRequirement = experienceKeywords.some((keyword) =>
      jobText.includes(keyword)
    );

    if (!hasExperienceRequirement) {
      return 0.5; // Neutral score if no specific requirement
    }

    // Score based on experience level
    if (experienceYears >= 5) {
      return 1.0;
    } else if (experienceYears >= 3) {
      return 0.8;
    } else if (experienceYears >= 1) {
      return 0.6;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate availability match
   */
  private static calculateAvailabilityMatch(
    job: JobPost,
    availabilitySchedule: any
  ): number {
    // This is a simplified version - in reality, you'd need to parse
    // the job requirements and match against the availability schedule
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = dayNames[new Date().getDay()];
    const daySchedule = availabilitySchedule[currentDay];

    if (daySchedule?.available) {
      return 1.0;
    }

    // Check if available on any day
    const hasAnyAvailability = Object.values(availabilitySchedule).some(
      (day: any) => day.available
    );
    return hasAnyAvailability ? 0.5 : 0;
  }

  /**
   * Get matched jobs for a helper
   */
  static async getMatchedJobs(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JobWithMatchingScore[]> {
    const profile = await this.getHelperProfile(userId);
    if (!profile) {
      return [];
    }

    const supabase = await createClient();

    // Get all active jobs
    const { data: jobs, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }

    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Calculate matching scores for all jobs and ensure serialization
    const jobsWithScores = jobs.map((job) => {
      const matchingScore = this.calculateMatchingScore(job, profile);
      return {
        // Ensure job data is serialized
        id: String(job.id),
        family_id: String(job.family_id),
        title: String(job.title),
        description: String(job.description),
        job_type: job.job_type ? String(job.job_type) : null,
        location: String(job.location),
        salary_min: Number(job.salary_min),
        salary_max: Number(job.salary_max),
        salary_rate: String(job.salary_rate),
        created_at: String(job.created_at),
        updated_at: String(job.updated_at),
        is_active: Boolean(job.is_active),
        // Ensure matching score is serialized
        matchingScore: {
          jobId: String(matchingScore.jobId),
          score: Number(matchingScore.score),
          reasons: Array.isArray(matchingScore.reasons)
            ? matchingScore.reasons.map(String)
            : [],
          breakdown: {
            jobTypeMatch: Number(matchingScore.breakdown.jobTypeMatch),
            locationMatch: Number(matchingScore.breakdown.locationMatch),
            salaryMatch: Number(matchingScore.breakdown.salaryMatch),
            skillsMatch: Number(matchingScore.breakdown.skillsMatch),
            experienceMatch: Number(matchingScore.breakdown.experienceMatch),
            availabilityMatch: Number(matchingScore.breakdown.availabilityMatch),
            ratingBonus: Number(matchingScore.breakdown.ratingBonus),
            recencyBonus: Number(matchingScore.breakdown.recencyBonus),
          },
        },
      };
    });

    // Sort by matching score (highest first)
    jobsWithScores.sort(
      (a, b) => b.matchingScore.score - a.matchingScore.score
    );

    // Apply pagination
    const result = jobsWithScores.slice(offset, offset + limit);
    
    // Final serialization to ensure everything is a plain object
    return JSON.parse(JSON.stringify(result));
  }

  /**
   * Get matched jobs for a helper (client-side)
   */
  static async getMatchedJobsClient(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JobWithMatchingScore[]> {
    const profile = await this.getHelperProfile(userId);
    if (!profile) {
      return [];
    }

    const supabase = createClientClient();

    // Get all active jobs
    const { data: jobs, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }

    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Calculate matching scores for all jobs and ensure serialization
    const jobsWithScores = jobs.map((job) => {
      const matchingScore = this.calculateMatchingScore(job, profile);
      return {
        // Ensure job data is serialized
        id: String(job.id),
        family_id: String(job.family_id),
        title: String(job.title),
        description: String(job.description),
        job_type: job.job_type ? String(job.job_type) : null,
        location: String(job.location),
        salary_min: Number(job.salary_min),
        salary_max: Number(job.salary_max),
        salary_rate: String(job.salary_rate),
        created_at: String(job.created_at),
        updated_at: String(job.updated_at),
        is_active: Boolean(job.is_active),
        // Ensure matching score is serialized
        matchingScore: {
          jobId: String(matchingScore.jobId),
          score: Number(matchingScore.score),
          reasons: Array.isArray(matchingScore.reasons)
            ? matchingScore.reasons.map(String)
            : [],
          breakdown: {
            jobTypeMatch: Number(matchingScore.breakdown.jobTypeMatch),
            locationMatch: Number(matchingScore.breakdown.locationMatch),
            salaryMatch: Number(matchingScore.breakdown.salaryMatch),
            skillsMatch: Number(matchingScore.breakdown.skillsMatch),
            experienceMatch: Number(matchingScore.breakdown.experienceMatch),
            availabilityMatch: Number(matchingScore.breakdown.availabilityMatch),
            ratingBonus: Number(matchingScore.breakdown.ratingBonus),
            recencyBonus: Number(matchingScore.breakdown.recencyBonus),
          },
        },
      };
    });

    // Sort by matching score (highest first)
    jobsWithScores.sort(
      (a, b) => b.matchingScore.score - a.matchingScore.score
    );

    // Apply pagination
    const result = jobsWithScores.slice(offset, offset + limit);
    
    // Final serialization to ensure everything is a plain object
    return JSON.parse(JSON.stringify(result));
  }

  /**
   * Get matching reasons for a specific job
   */
  static async getJobMatchingReasons(
    jobId: string,
    userId: string
  ): Promise<MatchingScore | null> {
    const profile = await this.getHelperProfile(userId);
    if (!profile) {
      return null;
    }

    const supabase = await createClient();
    const { data: job, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", jobId)
      .eq("is_active", true)
      .single();

    if (error || !job) {
      return null;
    }

    return this.calculateMatchingScore(job, profile);
  }
}

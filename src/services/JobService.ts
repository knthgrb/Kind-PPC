import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { JobPost } from "@/types/jobPosts";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

const getKindbossingUserId = (job: any): string => {
  if (typeof job?.kindbossing_user_id === "string") {
    return job.kindbossing_user_id;
  }
  if (typeof job?.user_id === "string") {
    return job.user_id;
  }
  if (typeof job?.kindbossing?.id === "string") {
    return job.kindbossing.id;
  }
  if (typeof job?.kindbossing?.user_id === "string") {
    return job.kindbossing.user_id;
  }
  return "";
};

const mapJobToJobPost = (job: any): JobPost => {
  const jobRecord = job as {
    _id: string;
    job_title?: string;
    job_description?: string;
    job_type?: string;
    location?: string;
    province?: string;
    region?: string;
    salary?: string;
    salary_min?: number;
    salary_max?: number;
    salary_type?: string;
    required_skills?: string[];
    work_schedule?: any;
    required_years_of_experience?: number;
    preferred_languages?: string[];
    is_boosted?: boolean;
    boost_expires_at?: number;
    status?: string;
    created_at: number;
    updated_at?: number;
    expires_at?: number;
    location_coordinates?: { lat: number; lng: number } | null;
  };

  const kindbossingUserId = getKindbossingUserId(jobRecord);

  return {
    id: String(jobRecord._id),
    kindbossing_user_id: kindbossingUserId,
    job_title: jobRecord.job_title || "",
    job_description: jobRecord.job_description || "",
    job_type: (jobRecord.job_type || null) as any,
    location: jobRecord.location || "",
    province: jobRecord.province,
    region: jobRecord.region,
    salary: jobRecord.salary || "0",
    salary_min: jobRecord.salary_min || 0,
    salary_max: jobRecord.salary_max || 0,
    salary_type: jobRecord.salary_type || "monthly",
    required_skills: jobRecord.required_skills || [],
    work_schedule: jobRecord.work_schedule || null,
    required_years_of_experience: jobRecord.required_years_of_experience || 0,
    preferred_languages: jobRecord.preferred_languages || [],
    is_boosted: jobRecord.is_boosted || false,
    boost_expires_at: jobRecord.boost_expires_at
      ? new Date(jobRecord.boost_expires_at).toISOString()
      : null,
    status: (jobRecord.status || "active") as "active" | "paused" | "closed",
    created_at: new Date(jobRecord.created_at).toISOString(),
    updated_at: jobRecord.updated_at
      ? new Date(jobRecord.updated_at).toISOString()
      : new Date(jobRecord.created_at).toISOString(),
    location_coordinates: jobRecord.location_coordinates
      ? JSON.stringify(jobRecord.location_coordinates)
      : null,
    expires_at: jobRecord.expires_at
      ? new Date(jobRecord.expires_at).toISOString()
      : undefined,
  };
};

export type JobFilters = {
  search?: string;
  province?: string;
  radius?: number;
  jobType?: string;
  userLat?: number;
  userLng?: number;
  limit?: number;
  offset?: number;
  page?: number; // 1-based, alternative to offset
};

export type JobFilterOptions = {
  provinces: string[];
  jobTypes: string[];
};

export const JobService = {
  /**
   * Fetch job by ID
   */
  async fetchById(convex: ConvexClient, id: string) {
    try {
      const job = await convex.query(api.jobs.getJobById, { jobId: id });
      if (!job) return null;

      // Convert Convex job to JobPost format
      return mapJobToJobPost(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      return null;
    }
  },

  /**
   * Fetch jobs with filters
   */
  async fetchJobs(
    convex: ConvexClient,
    filters?: JobFilters
  ): Promise<JobPost[]> {
    try {
      const jobs = await convex.query(api.jobs.getJobs, {
        filters: filters
          ? {
              jobType: filters.jobType,
              search: filters.search,
              province: filters.province,
              limit: filters.limit,
              offset: filters.offset,
              page: filters.page,
            }
          : undefined,
      });

      // Convert Convex jobs to JobPost format
      return jobs.map((job) => mapJobToJobPost(job));
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }
  },

  /**
   * Fetch jobs posted by a specific employer
   */
  async fetchMyJobs(
    convex: ConvexClient,
    employerId: string
  ): Promise<JobPost[]> {
    try {
      const jobs = await convex.query(api.jobs.getJobsByKindBossing, {
        userId: employerId,
      });

      // Convert to JobPost format
      return jobs.map((job) => ({
        id: String(job._id),
        kindbossing_user_id: job.kindbossing_user_id,
        job_title: job.job_title,
        job_description: job.job_description || "",
        job_type: job.job_type as any,
        location: job.location,
        salary: job.salary || "0",
        salary_min: job.salary_min || 0,
        salary_max: job.salary_max || 0,
        salary_type: job.salary_type || "monthly",
        required_skills: job.required_skills || [],
        work_schedule: job.work_schedule || null,
        required_years_of_experience: job.required_years_of_experience || 0,
        preferred_languages: job.preferred_languages || [],
        is_boosted: job.is_boosted || false,
        boost_expires_at: job.boost_expires_at
          ? new Date(job.boost_expires_at).toISOString()
          : null,
        status: job.status as "active" | "paused" | "closed",
        created_at: new Date(job.created_at).toISOString(),
        updated_at: job.updated_at
          ? new Date(job.updated_at).toISOString()
          : new Date(job.created_at).toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching my jobs:", error);
      return [];
    }
  },

  /**
   * Fetch job filter options
   */
  async fetchJobFilterOptions(convex: ConvexClient): Promise<JobFilterOptions> {
    try {
      // Fetch all active jobs to extract filter options
      const jobs = await convex.query(api.jobs.getJobs, {
        filters: { limit: 1000 }, // Get a large batch to extract unique values
      });

      // Extract provinces from locations
      const provincesSet = new Set<string>();
      const jobTypesSet = new Set<string>();

      jobs.forEach((job) => {
        if (job.location) {
          // Extract province from location string
          const parts = job.location.split(",").map((p) => p.trim());
          const province = parts[parts.length - 1]; // Assume province is the last part
          if (province) provincesSet.add(province);
        }
        if (job.job_type) {
          jobTypesSet.add(job.job_type);
        }
      });

      const provinces = [
        "All",
        ...Array.from(provincesSet).sort((a, b) => a.localeCompare(b)),
      ];

      const jobTypes = [
        "All",
        "Hourly",
        "Daily",
        "Contractual",
        "Full-time",
        "Part-time",
        "Freelance",
        "Temporary",
        "Permanent",
        ...Array.from(jobTypesSet),
      ];

      return {
        provinces,
        jobTypes,
      };
    } catch (error) {
      console.error("Error fetching job filter options:", error);
      return {
        provinces: ["All"],
        jobTypes: [
          "All",
          "Hourly",
          "Daily",
          "Contractual",
          "Full-time",
          "Part-time",
          "Freelance",
          "Temporary",
          "Permanent",
        ],
      };
    }
  },

  // Utility methods (don't need convex)
  parseSalaryRange(salaryRange: string): { min: number; max: number } | null {
    const cleanRange = salaryRange.replace(/[^\d\-\+<]/g, "");

    if (cleanRange.includes("-")) {
      const [min, max] = cleanRange.split("-").map(Number);
      return { min: min || 0, max: max || 0 };
    } else if (cleanRange.includes("+")) {
      const min = parseInt(cleanRange.replace("+", ""));
      return { min: min || 0, max: min * 2 }; // Assume max is 2x min
    } else if (cleanRange.startsWith("<")) {
      const max = parseInt(cleanRange.replace("<", ""));
      return { min: 0, max: max || 0 };
    } else {
      const amount = parseInt(cleanRange);
      if (amount) {
        return { min: amount * 0.8, max: amount * 1.2 }; // ±20% range
      }
    }

    return null;
  },

  filterByRadius(
    jobs: JobPost[],
    userLat: number,
    userLng: number,
    radiusKm: number
  ): JobPost[] {
    if (!userLat || !userLng || radiusKm <= 0) {
      return jobs;
    }

    return jobs.filter((job) => {
      // Simplified implementation - in production you'd calculate actual distance
      return true;
    });
  },

  extractProvinceFromLocation(location: string): string | null {
    if (!location) return null;
    // Implementation for extracting province
    return null;
  },

  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  /**
   * Client-side method to fetch matched jobs
   * Uses JobMatchingService internally
   */
  async fetchMatchedJobsClient(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { convex } = await import("@/utils/convex/client");
      const { JobMatchingService } = await import("./JobMatchingService");
      const result = await JobMatchingService.getMatchedJobs(
        convex,
        userId,
        limit,
        offset
      );
      return result.jobs || [];
    } catch (error) {
      console.error("Error fetching matched jobs:", error);
      return [];
    }
  },
};

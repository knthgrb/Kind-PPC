import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";
import { JobPost } from "@/types/jobPosts";
import { JobPreferences } from "./JobPreferencesService";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export type MatchedJob = JobPost & {
  matchScore: number;
  breakdown: {
    jobTitle: number;
    jobType: number;
    location: number;
    salary: number;
    languages: number;
  };
};

/**
 * Job Matching Service
 * Implements weighted scoring algorithm for matching jobs to user preferences
 */
export const JobMatchingService = {
  /**
   * Calculate Haversine distance between two coordinates
   */
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
   * Map Convex job to JobPost format
   */
  mapJobToJobPost(job: any): JobPost {
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
      kindbossing_user_id?: string;
    };

    const kindbossingUserId =
      jobRecord.kindbossing_user_id ||
      (jobRecord as any).kindbossing?.id ||
      (jobRecord as any).kindbossing?.user_id ||
      "";

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
      status: (jobRecord.status || "active") as
        | "active"
        | "paused"
        | "closed",
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
  },

  /**
   * Score job title (50% weight)
   * Hard filter: Must match desired_jobs, otherwise score = 0
   */
  scoreJobTitle(
    jobTitle: string,
    desiredJobs: string[]
  ): { score: number; passed: boolean } {
    if (!desiredJobs || desiredJobs.length === 0) {
      return { score: 0, passed: false };
    }

    const normalizedJobTitle = jobTitle.toLowerCase().trim();
    const normalizedDesired = desiredJobs.map((j) => j.toLowerCase().trim());

    // Check for exact match
    if (normalizedDesired.includes(normalizedJobTitle)) {
      return { score: 100, passed: true };
    }

    // Check for partial match (job title contains desired job or vice versa)
    for (const desired of normalizedDesired) {
      if (
        normalizedJobTitle.includes(desired) ||
        desired.includes(normalizedJobTitle)
      ) {
        return { score: 100, passed: true };
      }
    }

    return { score: 0, passed: false };
  },

  /**
   * Score job type (25% weight)
   */
  scoreJobType(
    jobType: string | null,
    desiredJobTypes: string[]
  ): number {
    if (!jobType) return 60; // Non-match but still show

    if (!desiredJobTypes || desiredJobTypes.length === 0) {
      return 60; // No preference, neutral score
    }

    const normalizedJobType = jobType.toLowerCase().trim();
    const normalizedDesired = desiredJobTypes.map((t) => t.toLowerCase().trim());

    if (normalizedDesired.includes(normalizedJobType)) {
      return 100; // Perfect match
    }

    return 60; // Non-match but still show
  },

  /**
   * Score location (15% weight)
   */
  scoreLocation(
    jobLocation: string,
    jobCoordinates: { lat: number; lng: number } | null,
    userCoordinates: { lat: number; lng: number } | null,
    desiredLocations: string[],
    preferredRadiusKm: number
  ): number {
    // Exact location match
    if (desiredLocations && desiredLocations.length > 0) {
      const normalizedJobLocation = jobLocation.toLowerCase().trim();
      const normalizedDesired = desiredLocations.map((l) =>
        l.toLowerCase().trim()
      );

      for (const desired of normalizedDesired) {
        if (normalizedJobLocation.includes(desired)) {
          return 100; // Exact match
        }
      }

      // Region/province level matching
      const jobParts = normalizedJobLocation.split(",").map((p) => p.trim());
      for (const desired of normalizedDesired) {
        if (jobParts.some((part) => part.includes(desired))) {
          return 80; // Region match
        }
      }

      // City name matching (fuzzy)
      for (const desired of normalizedDesired) {
        const desiredParts = desired.split(" ").filter((p) => p.length > 2);
        if (desiredParts.some((part) => normalizedJobLocation.includes(part))) {
          return 90; // City match
        }
      }
    }

    // Distance-based scoring
    if (
      jobCoordinates &&
      userCoordinates &&
      userCoordinates.lat &&
      userCoordinates.lng &&
      jobCoordinates.lat &&
      jobCoordinates.lng
    ) {
      const distance = this.calculateDistance(
        userCoordinates.lat,
        userCoordinates.lng,
        jobCoordinates.lat,
        jobCoordinates.lng
      );

      if (distance <= preferredRadiusKm) {
        // Within preferred radius - score based on proximity
        const proximityScore = Math.max(
          60,
          100 - (distance / preferredRadiusKm) * 40
        );
        return Math.round(proximityScore);
      }
    }

    return 50; // Fallback - shows jobs outside preferred locations
  },

  /**
   * Score salary (8% weight)
   */
  scoreSalary(
    jobSalaryMin: number | undefined,
    jobSalaryMax: number | undefined,
    jobSalaryType: string | undefined,
    userSalaryMin: number,
    userSalaryMax: number,
    userSalaryType: string
  ): number {
    // No salary preference
    if (!userSalaryMin && !userSalaryMax) {
      return 50; // Neutral
    }

    // No job salary info
    if (!jobSalaryMin && !jobSalaryMax) {
      return 50; // Neutral
    }

    // Convert to same type for comparison (simplified - in production, handle conversions)
    // For now, assume same type or use a conversion factor
    const jobMin = jobSalaryMin || 0;
    const jobMax = jobSalaryMax || jobMin;
    const userMin = userSalaryMin || 0;
    const userMax = userSalaryMax || userMin;

    // Perfect match - salary within user's range
    if (jobMin >= userMin && jobMax <= userMax) {
      return 100;
    }

    // Job salary overlaps with user's range
    if (jobMin <= userMax && jobMax >= userMin) {
      return 80; // Flexible match
    }

    // Job pays more than expected (within 20% threshold)
    if (jobMin > userMax) {
      const threshold = userMax * 1.2;
      if (jobMin <= threshold) {
        return 70; // Higher pay but acceptable
      }
    }

    // Job pays less than expected
    if (jobMax < userMin) {
      return 40; // Lower pay
    }

    return 50; // Default
  },

  /**
   * Score languages (2% weight)
   */
  scoreLanguages(
    jobLanguages: string[],
    desiredLanguages: string[]
  ): number {
    // No language requirement
    if (!jobLanguages || jobLanguages.length === 0) {
      return 100;
    }

    // No user preference
    if (!desiredLanguages || desiredLanguages.length === 0) {
      return 100; // No requirement from user
    }

    const normalizedJob = jobLanguages.map((l) => l.toLowerCase().trim());
    const normalizedDesired = desiredLanguages.map((l) =>
      l.toLowerCase().trim()
    );

    // Check for matches
    const matches = normalizedJob.filter((jLang) =>
      normalizedDesired.includes(jLang)
    );

    if (matches.length === normalizedJob.length) {
      return 100; // Perfect match - all required languages match
    }

    if (matches.length > 0) {
      // Partial match - score based on percentage
      const matchPercentage = matches.length / normalizedJob.length;
      return Math.round(60 + matchPercentage * 20); // 60-80 range
    }

    return 40; // No match
  },

  /**
   * Calculate priority score for sorting
   */
  calculatePriority(job: JobPost): number {
    let priority = 0;

    // Boost factor
    if (job.is_boosted && job.boost_expires_at) {
      const now = Date.now();
      const expiresAt = new Date(job.boost_expires_at).getTime();
      if (expiresAt > now) {
        priority += 1000; // Boosted jobs get high priority
      }
    }

    // Freshness (newer jobs get higher priority)
    const createdAt = new Date(job.created_at).getTime();
    const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    priority += Math.max(0, 100 - daysSinceCreation); // Decrease by 1 per day

    // Salary attractiveness
    if (job.salary_max) {
      priority += Math.min(50, job.salary_max / 1000); // Higher salary = higher priority
    }

    // Urgency (expiring soon)
    if (job.expires_at) {
      const expiresAt = new Date(job.expires_at).getTime();
      const daysUntilExpiry = (expiresAt - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry > 0 && daysUntilExpiry < 7) {
        priority += 50; // Urgent - expiring soon
      }
    }

    return priority;
  },

  /**
   * Get matched jobs for a user based on preferences
   */
  async getMatchedJobs(
    convex: ConvexClient,
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ jobs: MatchedJob[]; error?: string }> {
    try {
      // Get user preferences
      const { JobPreferencesService } = await import("./JobPreferencesService");
      const preferencesResult = await JobPreferencesService.getJobPreferences(convex, userId);

      if (!preferencesResult.data) {
        logger.warn("No job preferences found for user:", userId);
        return { jobs: [] };
      }

      const preferences = preferencesResult.data;

      // Get user location
      const userLocation = await convex.query(api.users.getUserLocation, {
        userId,
      });

      const userCoordinates = userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : null;

      // Get all active jobs
      const allJobs = await convex.query(api.jobs.getJobs, {
        filters: { limit: 1000 }, // Get a large batch to filter
      });

      // Get user's swipe history to exclude already-seen jobs
      const interactions = await convex.query(
        api.swipes.getJobInteractionsByUser,
        { userId }
      );

      const swipedJobIds = new Set(
        interactions
          .filter((i) => !i.is_rewound)
          .map((i) => i.job_post_id)
      );

      // Score and filter jobs
      const scoredJobs: MatchedJob[] = [];

      for (const job of allJobs) {
        // Skip already swiped jobs
        if (swipedJobIds.has(String(job._id))) {
          continue;
        }

        // Hard filter: Job title must match
        const titleResult = this.scoreJobTitle(
          job.job_title,
          preferences.desiredJobs
        );

        if (!titleResult.passed) {
          continue; // Exclude jobs that don't match desired job titles
        }

        // Score each criterion
        const jobTypeScore = this.scoreJobType(
          job.job_type,
          preferences.desiredJobTypes
        );

        // Parse job coordinates
        let jobCoordinates: { lat: number; lng: number } | null = null;
        if (job.location_coordinates) {
          if (typeof job.location_coordinates === "string") {
            try {
              const parsed = JSON.parse(job.location_coordinates);
              jobCoordinates = {
                lat: parsed.lat || parsed.y || 0,
                lng: parsed.lng || parsed.x || 0,
              };
            } catch {
              // Invalid JSON, skip
            }
          } else if (
            typeof job.location_coordinates === "object" &&
            job.location_coordinates !== null
          ) {
            jobCoordinates = {
              lat: (job.location_coordinates as any).lat || 0,
              lng: (job.location_coordinates as any).lng || 0,
            };
          }
        }

        const locationScore = this.scoreLocation(
          job.location,
          jobCoordinates,
          userCoordinates,
          preferences.desiredLocations,
          preferences.preferredWorkRadiusKm
        );

        const salaryScore = this.scoreSalary(
          job.salary_min,
          job.salary_max,
          job.salary_type,
          preferences.salaryRange.min,
          preferences.salaryRange.max,
          preferences.salaryRange.salaryType
        );

        const languagesScore = this.scoreLanguages(
          job.preferred_languages || [],
          preferences.preferredLanguages
        );

        // Calculate final weighted score
        const finalScore =
          titleResult.score * 0.5 +
          jobTypeScore * 0.25 +
          locationScore * 0.15 +
          salaryScore * 0.08 +
          languagesScore * 0.02;

        // Only include jobs with score > 0
        if (finalScore > 0) {
          // Map job to JobPost format
          const jobPost = this.mapJobToJobPost(job);

          scoredJobs.push({
            ...jobPost,
            matchScore: Math.round(finalScore * 100) / 100,
            breakdown: {
              jobTitle: titleResult.score,
              jobType: jobTypeScore,
              location: locationScore,
              salary: salaryScore,
              languages: languagesScore,
            },
          });
        }
      }

      // Sort by match score (highest first), then by priority
      scoredJobs.sort((a, b) => {
        const scoreDiff = b.matchScore - a.matchScore;
        if (Math.abs(scoreDiff) > 0.1) {
          return scoreDiff;
        }
        // If scores are close, use priority
        const priorityA = this.calculatePriority(a);
        const priorityB = this.calculatePriority(b);
        return priorityB - priorityA;
      });

      // Apply pagination
      const paginatedJobs = scoredJobs.slice(offset, offset + limit);

      logger.info("Matched jobs found:", {
        userId,
        total: scoredJobs.length,
        returned: paginatedJobs.length,
      });

      return { jobs: paginatedJobs };
    } catch (error) {
      logger.error("Error getting matched jobs:", error);
      return {
        jobs: [],
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      };
    }
  },
};


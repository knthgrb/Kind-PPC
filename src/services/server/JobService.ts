import { createClient } from "@/utils/supabase/server";
import { logger } from "@/utils/logger";
import {
  areProvincesInSameRegion,
  getRegionForProvince,
} from "@/utils/regionMapping";
import { JobPost, SalaryRate, JobType } from "@/types/jobPosts";

export interface JobMatch {
  jobId: string;
  job: any;
  score: number;
  reasons: string[];
  breakdown: {
    jobTitle: number;
    jobType: number;
    location: number;
    salary: number;
    languages: number;
    skills: number;
    priority: number;
  };
}

interface KindTaoJobPreferences {
  desiredJobs: string[];
  desiredLocations: string[];
  desiredJobTypes: string[];
  salaryRange: {
    min: number;
    max: number;
    salaryType: string;
  };
  preferredLanguages: string[];
  preferredWorkRadiusKm: number;
}

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

export class JobService {
  /**
   * Fetch job by ID
   */
  static async fetchById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_posts")
      .select(
        `
        id,
        kindbossing_user_id,
        job_title,
        job_description,
        location,
        salary,
        job_type,
        required_skills,
        work_schedule,
        required_years_of_experience,
        preferred_languages,
        is_boosted,
        boost_expires_at,
        status,
        created_at,
        updated_at
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return null;
    }

    if (!data) return null;

    const result = {
      id: String(data.id),
      kindbossing_user_id: String(data.kindbossing_user_id),
      job_title: String(data.job_title),
      job_description: String(data.job_description || ""),
      job_type: data.job_type,
      location: String(data.location),
      salary: String(data.salary || ""),
      required_skills: Array.isArray(data.required_skills)
        ? data.required_skills
        : [],
      work_schedule: data.work_schedule || null,
      required_years_of_experience: Number(
        data.required_years_of_experience || 0
      ),
      preferred_languages: Array.isArray(data.preferred_languages)
        ? data.preferred_languages
        : [],
      is_boosted: Boolean(data.is_boosted),
      boost_expires_at: data.boost_expires_at
        ? String(data.boost_expires_at)
        : null,
      status: (data.status || "active") as "active" | "paused" | "closed",
      created_at: String(data.created_at),
      updated_at: String(data.updated_at),
    };

    return JSON.parse(JSON.stringify(result));
  }

  /**
   * Fetch jobs with filters (server-side)
   */
  static async fetchJobs(filters?: JobFilters): Promise<JobPost[]> {
    const supabase = await createClient();

    const now = new Date().toISOString();
    let query = supabase
      .from("job_posts")
      .select(
        `
        id,
        kindbossing_user_id,
        job_title,
        job_description,
        required_skills,
        salary,
        work_schedule,
        required_years_of_experience,
        location,
        preferred_languages,
        status,
        is_boosted,
        boost_expires_at,
        updated_at,
        job_type,
        created_at
      `
      )
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.jobType && filters.jobType !== "All") {
      query = query.eq("job_type", filters.jobType);
    }

    // Handle search
    if (filters?.search && filters.search.trim().length > 0) {
      const searchTerm = filters.search.trim().replace(/%/g, "");
      query = query.or(
        `job_title.ilike.%${searchTerm}%,job_description.ilike.%${searchTerm}%,required_skills.cs.{${searchTerm}}`
      );
    }

    // Handle province filtering
    if (filters?.province && filters.province !== "All") {
      query = query.ilike("location", `%${filters.province}%`);
    }

    // Handle pagination
    if (filters?.limit) {
      if (filters.offset !== undefined) {
        // Use offset-based pagination
        const from = filters.offset;
        const to = filters.offset + filters.limit - 1;
        query = query.range(from, to);
      } else if (filters.page) {
        // Use page-based pagination (1-based)
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      } else {
        // Just limit without pagination
        query = query.limit(filters.limit);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }

    // Convert job_posts schema to JobPost format
    const jobs = (data ?? []).map((job) => {
      return {
        id: String(job.id),
        kindbossing_user_id: String(job.kindbossing_user_id),
        job_title: String(job.job_title),
        job_description: String(job.job_description || ""),
        job_type: job.job_type as any,
        location: String(job.location),
        salary: String(job.salary || ""),
        required_skills: Array.isArray(job.required_skills)
          ? job.required_skills
          : [],
        work_schedule: job.work_schedule || null,
        required_years_of_experience: Number(
          job.required_years_of_experience || 0
        ),
        preferred_languages: Array.isArray(job.preferred_languages)
          ? job.preferred_languages
          : [],
        is_boosted: Boolean(job.is_boosted),
        boost_expires_at: job.boost_expires_at
          ? String(job.boost_expires_at)
          : null,
        status: (job.status || "active") as "active" | "paused" | "closed",
        created_at: String(job.created_at),
        updated_at: String(job.updated_at),
      };
    });

    // Apply radius filtering if user coordinates are provided
    if (filters?.userLat && filters?.userLng && filters?.radius) {
      return this.filterByRadius(
        jobs,
        filters.userLat,
        filters.userLng,
        filters.radius
      );
    }

    return jobs;
  }

  /**
   * Parse salary range string (e.g., "15000-25000", "20000+", "<30000")
   */
  private static parseSalaryRange(
    salaryRange: string
  ): { min: number; max: number } | null {
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
  }

  /**
   * Filter jobs by radius using Haversine formula
   */
  private static filterByRadius(
    jobs: JobPost[],
    userLat: number,
    userLng: number,
    radiusKm: number
  ): JobPost[] {
    if (!userLat || !userLng || radiusKm <= 0) {
      return jobs;
    }

    return jobs.filter((job) => {
      // For now, we'll use a simplified approach since job locations are stored as strings
      // In a real implementation, you'd store lat/lng coordinates for each job
      // and calculate the actual distance using the Haversine formula

      // Extract province from job location
      const jobLocation = job.location?.toLowerCase() || "";
      const userProvince = this.extractProvinceFromLocation(jobLocation);

      // If we can't determine the province, include the job
      if (!userProvince) return true;

      // For now, we'll include jobs within the same province
      // This is a simplified implementation - in production you'd want to:
      // 1. Store lat/lng coordinates for each job location
      // 2. Use the Haversine formula to calculate actual distances
      // 3. Filter based on the calculated distance

      return true; // Simplified: include all jobs for now
    });
  }

  /**
   * Extract province from location string
   */
  private static extractProvinceFromLocation(location: string): string | null {
    if (!location) return null;

    // Common province patterns in the Philippines
    const provinces = [
      "metro manila",
      "manila",
      "quezon city",
      "makati",
      "taguig",
      "pasig",
      "cebu",
      "davao",
      "cagayan",
      "laguna",
      "cavite",
      "bulacan",
      "pampanga",
      "bataan",
      "rizal",
      "nueva ecija",
      "tarlac",
      "zambales",
      "aurora",
      "batangas",
      "cavite",
      "laguna",
      "quezon",
      "rizal",
      "marinduque",
      "occidental mindoro",
      "oriental mindoro",
      "palawan",
      "romblon",
      "albay",
      "camarines norte",
      "camarines sur",
      "catanduanes",
      "masbate",
      "sorsogon",
      "aklan",
      "antique",
      "capiz",
      "guimaras",
      "iloilo",
      "negros occidental",
      "bohol",
      "cebu",
      "negros oriental",
      "siquijor",
      "biliran",
      "eastern samar",
      "leyte",
      "northern samar",
      "southern leyte",
      "western samar",
      "zamboanga del norte",
      "zamboanga del sur",
      "zamboanga sibugay",
      "bukidnon",
      "camiguin",
      "lanao del norte",
      "misamis occidental",
      "misamis oriental",
      "davao del norte",
      "davao del sur",
      "davao occidental",
      "davao oriental",
      "compostela valley",
      "cotabato",
      "sarangani",
      "south cotabato",
      "agusan del norte",
      "agusan del sur",
      "dinagat islands",
      "surigao del norte",
      "surigao del sur",
      "basilan",
      "lanao del sur",
      "maguindanao",
      "sulu",
      "tawi-tawi",
    ];

    const lowerLocation = location.toLowerCase();
    for (const province of provinces) {
      if (lowerLocation.includes(province)) {
        return province;
      }
    }

    return null;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(
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
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Fetch jobs with filters (client-side)
   */
  static async fetchJobsClient(filters?: JobFilters): Promise<JobPost[]> {
    const supabase = await createClient();

    let query = supabase
      .from("job_posts")
      .select(
        `
        id,
        kindbossing_user_id,
        title,
        description,
        location,
        salary,
        job_type,
        required_skills,
        work_schedule,
        required_years_of_experience,
        preferred_languages,
        is_boosted,
        boost_expires_at,
        status,
        created_at,
        updated_at
        `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    // Apply search filter
    if (filters?.search && filters.search.trim().length > 0) {
      const searchTerm = filters.search.trim().replace(/%/g, "");
      query = query.or(
        `job_title.ilike.%${searchTerm}%,job_description.ilike.%${searchTerm}%,required_skills.cs.{${searchTerm}}`
      );
    }

    // Apply province filter
    if (filters?.province && filters.province !== "All") {
      query = query.ilike("location", `%${filters.province}%`);
    }

    // Apply job type filter
    if (filters?.jobType && filters.jobType !== "All") {
      query = query.eq("job_type", filters.jobType);
    }

    // Handle pagination
    if (filters?.limit) {
      if (filters.offset !== undefined) {
        // Use offset-based pagination
        const from = filters.offset;
        const to = filters.offset + filters.limit - 1;
        query = query.range(from, to);
      } else if (filters.page) {
        // Use page-based pagination (1-based)
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      } else {
        // Just limit without pagination
        query = query.limit(filters.limit);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs (client):", error);
      return [];
    }

    // Transform and filter jobs
    const jobs = (data || []).map((job) => {
      return {
        id: String(job.id),
        kindbossing_user_id: String(job.kindbossing_user_id),
        job_title: String(job.title || ""),
        job_description: String(job.description || ""),
        job_type: job.job_type as JobType | null,
        location: String(job.location || ""),
        salary: String(job.salary || ""),
        required_skills: Array.isArray(job.required_skills)
          ? job.required_skills
          : [],
        work_schedule: job.work_schedule || null,
        required_years_of_experience: Number(
          job.required_years_of_experience || 0
        ),
        preferred_languages: Array.isArray(job.preferred_languages)
          ? job.preferred_languages
          : [],
        is_boosted: Boolean(job.is_boosted),
        boost_expires_at: job.boost_expires_at
          ? String(job.boost_expires_at)
          : null,
        status: (job.status || "active") as "active" | "paused" | "closed",
        created_at: String(job.created_at || ""),
        updated_at: String(job.updated_at || ""),
      };
    });

    // Apply radius filtering if user coordinates are provided
    if (filters?.userLat && filters?.userLng && filters?.radius) {
      return this.filterByRadius(
        jobs,
        filters.userLat,
        filters.userLng,
        filters.radius
      );
    }

    return jobs;
  }

  /**
   * Fetch job posts by kindBossing user
   */
  static async fetchJobPostsByKindBossing(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("kindbossing_user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching job posts:", error);
      return [];
    }

    return data ?? [];
  }

  /**
   * Fetch paginated job posts by kindBossing user
   */
  static async fetchPaginatedKindBossingPosts(
    userId: string,
    page: number,
    pageSize: number
  ) {
    const supabase = await createClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data: jobs,
      error: jobsError,
      count,
    } = await supabase
      .from("job_posts")
      .select("*", { count: "exact" })
      .eq("kindbossing_user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (jobsError) {
      console.error("Error fetching paginated job posts:", jobsError);
      return { jobs: [], total: 0 };
    }

    return { jobs: jobs ?? [], total: count ?? 0 };
  }

  /**
   * Get filter options
   */
  static async fetchJobFilterOptions(): Promise<JobFilterOptions> {
    const supabase = await createClient();

    const [{ data: locationsData }, { data: jobTypesData }] = await Promise.all(
      [
        supabase.from("job_posts").select("location").eq("status", "active"),
        supabase.from("job_posts").select("job_type").eq("status", "active"),
      ]
    );

    // Extract provinces from locations
    const provincesSet = new Set<string>();
    (locationsData ?? []).forEach((row: { location?: string }) => {
      if (row.location) {
        // Extract province from location string
        const parts = row.location.split(",").map((p) => p.trim());
        const province = parts[parts.length - 1]; // Assume province is the last part
        if (province) provincesSet.add(province);
      }
    });

    const jobTypesSet = new Set<string>();
    (jobTypesData ?? []).forEach((row: { job_type?: string }) => {
      if (row.job_type) jobTypesSet.add(row.job_type);
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
      ...Array.from(jobTypesSet).sort((a, b) => a.localeCompare(b)),
    ];

    return { provinces, jobTypes };
  }

  /**
   * Convenience function for latest jobs
   */
  static async fetchLatestJobs(
    limit: number = 8,
    filters?: Omit<JobFilters, "limit" | "offset" | "page">
  ): Promise<JobPost[]> {
    return this.fetchJobs({ ...filters, limit });
  }

  /**
   * Fetch matched jobs for KindTao users using matching algorithm
   */
  static async fetchMatchedJobs(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JobMatch[]> {
    const supabase = await createClient();
    return this.findMatchingJobs(supabase, userId, limit, offset);
  }

  /**
   * Fetch matched jobs for KindTao users using matching algorithm (client-side)
   */
  static async fetchMatchedJobsClient(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JobMatch[]> {
    const supabase = await createClient();
    return this.findMatchingJobs(supabase, userId, limit, offset);
  }

  private static async findMatchingJobs(
    supabase: any,
    kindtaoUserId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JobMatch[]> {
    try {
      const normalizedLimit =
        Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
      const normalizedOffset = Number.isFinite(offset)
        ? Math.max(Math.floor(offset), 0)
        : 0;

      if (normalizedLimit === 0) {
        return [];
      }

      const preferences = await this.getUserPreferences(
        supabase,
        kindtaoUserId
      );

      if (!preferences) {
        logger.warn(`No preferences found for user ${kindtaoUserId}`);
        return [];
      }

      const userLocation = await this.getUserLocation(supabase, kindtaoUserId);
      const userSkills = await this.getUserSkills(supabase, kindtaoUserId);

      const { data: swipedJobs, error: swipedError } = await supabase
        .from("kindtao_job_interactions")
        .select("job_post_id")
        .eq("kindtao_user_id", kindtaoUserId);

      if (swipedError) {
        logger.error("Error fetching swiped jobs:", swipedError);
        return [];
      }

      const swipedJobIds =
        swipedJobs?.map((item: { job_post_id: string }) => item.job_post_id) ||
        [];

      const now = new Date().toISOString();
      let query = supabase
        .from("job_posts")
        .select("*")
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("created_at", { ascending: false });

      if (swipedJobIds.length > 0) {
        query = query.not("id", "in", `(${swipedJobIds.join(",")})`);
      }

      query = query.range(
        normalizedOffset,
        normalizedOffset + normalizedLimit - 1
      );

      const { data: jobs, error } = await query;

      if (error) {
        logger.error("Error fetching job posts:", error);
        return [];
      }

      if (!jobs || jobs.length === 0) {
        return [];
      }

      const matches = jobs
        .map((job: any) =>
          this.calculateJobMatch(preferences, job, userLocation, userSkills)
        )
        .filter(Boolean) as JobMatch[];

      return matches
        .filter((match: JobMatch) => match.score > 0)
        .sort((a: JobMatch, b: JobMatch) => b.score - a.score)
        .slice(0, normalizedLimit);
    } catch (error) {
      logger.error("Error in findMatchingJobs:", error);
      return [];
    }
  }

  private static async getUserPreferences(
    supabase: any,
    userId: string
  ): Promise<KindTaoJobPreferences | null> {
    const { data, error } = await supabase
      .from("kindtao_job_preferences")
      .select("*")
      .eq("kindtao_user_id", userId)
      .single();

    if (error) {
      logger.error("Error fetching user preferences:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      desiredJobs: data.desired_jobs || [],
      desiredLocations: data.desired_locations || [],
      desiredJobTypes: data.desired_job_types || [],
      salaryRange: {
        min: data.salary_range_min || 0,
        max: data.salary_range_max || 0,
        salaryType: data.salary_type || "daily",
      },
      preferredLanguages: data.desired_languages || [],
      preferredWorkRadiusKm: data.desired_job_location_radius || 10,
    };
  }

  private static async getUserLocation(
    supabase: any,
    userId: string
  ): Promise<{ lat: number; lng: number } | null> {
    const { data, error } = await supabase
      .from("users")
      .select("location_coordinates")
      .eq("id", userId)
      .single();

    if (error || !data?.location_coordinates) {
      logger.warn(`No location coordinates found for user ${userId}`);
      return null;
    }

    const match = data.location_coordinates.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2]),
      };
    }

    return null;
  }

  private static async getUserSkills(
    supabase: any,
    userId: string
  ): Promise<string[]> {
    try {
      const { data: profile, error } = await supabase
        .from("kindtaos")
        .select("skills")
        .eq("user_id", userId)
        .single();

      if (error || !profile) {
        logger.warn(`No profile found for user ${userId}`);
        return [];
      }

      return profile.skills || [];
    } catch (error) {
      logger.error("Error fetching user skills:", error);
      return [];
    }
  }

  private static calculateJobMatch(
    preferences: KindTaoJobPreferences,
    job: any,
    userLocation?: { lat: number; lng: number } | null,
    userSkills?: string[]
  ): JobMatch {
    const hasDesiredJobTitle = preferences.desiredJobs.includes(job.job_title);
    const hasRequiredSkills = this.calculateSkillMatch(
      userSkills || [],
      job.required_skills || []
    );

    if (!hasDesiredJobTitle && !hasRequiredSkills) {
      return {
        jobId: job.id,
        job: job,
        score: 0,
        reasons: ["Job type not in your preferences and skills don't match"],
        breakdown: {
          jobTitle: 0,
          jobType: 0,
          location: 0,
          salary: 0,
          languages: 0,
          skills: 0,
          priority: 0,
        },
      };
    }

    const breakdown = {
      jobTitle: hasDesiredJobTitle ? 100 : 0,
      jobType: this.calculateJobTypeMatch(
        preferences.desiredJobTypes,
        job.job_type
      ),
      location: this.calculateLocationMatch(preferences, job, userLocation),
      salary: this.calculateSalaryMatch(preferences.salaryRange, job),
      languages: this.calculateLanguageMatch(
        preferences.preferredLanguages,
        job.preferred_languages
      ),
      skills: this.calculateSkillMatch(
        userSkills || [],
        job.required_skills || []
      ),
      priority: this.calculatePriorityScore(job),
    };

    const baseScore = Math.round(
      breakdown.jobTitle * 0.4 +
        breakdown.jobType * 0.2 +
        breakdown.location * 0.15 +
        breakdown.salary * 0.08 +
        breakdown.languages * 0.02 +
        breakdown.skills * 0.1 +
        breakdown.priority * 0.05
    );

    // Check if boost is active and not expired
    const isBoostActive =
      job.is_boosted &&
      job.boost_expires_at &&
      new Date(job.boost_expires_at) > new Date();

    const finalScore = isBoostActive ? Math.round(baseScore * 1.5) : baseScore;

    return {
      jobId: job.id,
      job: job,
      score: finalScore,
      reasons: this.generateMatchReasons(breakdown),
      breakdown,
    };
  }

  private static calculateSkillMatch(
    userSkills: string[],
    requiredSkills: string[]
  ): number {
    if (!requiredSkills || requiredSkills.length === 0) {
      return 50;
    }

    if (!userSkills || userSkills.length === 0) {
      return 0;
    }

    const userSkillsLower = userSkills.map((skill) =>
      skill.toLowerCase().trim()
    );
    const requiredSkillsLower = requiredSkills.map((skill) =>
      skill.toLowerCase().trim()
    );

    const matchingSkills = requiredSkillsLower.filter((requiredSkill) =>
      userSkillsLower.some(
        (userSkill) =>
          userSkill.includes(requiredSkill) || requiredSkill.includes(userSkill)
      )
    );

    const matchPercentage =
      (matchingSkills.length / requiredSkillsLower.length) * 100;

    return Math.round(matchPercentage);
  }

  private static calculatePriorityScore(job: any): number {
    let priorityScore = 50;

    if (job.is_boosted && job.boost_expires_at) {
      const boostExpiry = new Date(job.boost_expires_at);
      const now = new Date();
      if (boostExpiry > now) {
        priorityScore += 30;
      }
    }

    const jobAge = Date.now() - new Date(job.created_at).getTime();
    const daysOld = jobAge / (1000 * 60 * 60 * 24);

    if (daysOld < 1) {
      priorityScore += 20;
    } else if (daysOld < 3) {
      priorityScore += 15;
    } else if (daysOld < 7) {
      priorityScore += 10;
    } else if (daysOld < 14) {
      priorityScore += 5;
    }

    if (job.salary_min && job.salary_max) {
      const avgSalary = (job.salary_min + job.salary_max) / 2;
      if (avgSalary > 1000) {
        priorityScore += 10;
      } else if (avgSalary > 500) {
        priorityScore += 5;
      }
    }

    if (job.expires_at) {
      const expiryDate = new Date(job.expires_at);
      const daysUntilExpiry =
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry < 3) {
        priorityScore += 15;
      } else if (daysUntilExpiry < 7) {
        priorityScore += 10;
      }
    }

    return Math.min(priorityScore, 100);
  }

  private static calculateJobTypeMatch(
    desiredJobTypes: string[],
    jobType: string
  ): number {
    if (desiredJobTypes.includes(jobType)) {
      return 100;
    }

    return 60;
  }

  private static calculateLocationMatch(
    preferences: KindTaoJobPreferences,
    job: any,
    userLocation?: { lat: number; lng: number } | null
  ): number {
    if (preferences.desiredLocations.includes(job.location)) {
      return 100;
    }

    if (
      userLocation &&
      job.location_coordinates &&
      preferences.preferredWorkRadiusKm > 0
    ) {
      try {
        const jobCoordsMatch =
          job.location_coordinates.match(/\(([^,]+),([^)]+)\)/);
        if (jobCoordsMatch) {
          const jobLng = parseFloat(jobCoordsMatch[1]);
          const jobLat = parseFloat(jobCoordsMatch[2]);

          const distance = this.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            jobLat,
            jobLng
          );

          if (distance <= preferences.preferredWorkRadiusKm) {
            const score = Math.max(
              60,
              100 - (distance / preferences.preferredWorkRadiusKm) * 40
            );
            return Math.round(score);
          } else {
            return 30;
          }
        }
      } catch (error) {
        logger.warn("Error calculating location distance:", error);
      }
    }

    if (job.province && job.region) {
      const regionMatch = this.calculateRegionMatch(
        preferences.desiredLocations,
        job.province,
        job.region
      );
      if (regionMatch > 0) {
        return regionMatch;
      }
    }

    const fuzzyMatch = this.calculateFuzzyLocationMatch(
      preferences.desiredLocations,
      job.location
    );
    if (fuzzyMatch > 0) {
      return fuzzyMatch;
    }

    return 50;
  }

  private static calculateFuzzyLocationMatch(
    desiredLocations: string[],
    jobLocation: string
  ): number {
    if (!jobLocation || desiredLocations.length === 0) return 0;

    const jobLocationLower = jobLocation.toLowerCase().trim();

    for (const desiredLocation of desiredLocations) {
      const desiredLower = desiredLocation.toLowerCase().trim();

      if (desiredLower === jobLocationLower) {
        return 100;
      }

      if (
        jobLocationLower.includes(desiredLower) ||
        desiredLower.includes(jobLocationLower)
      ) {
        return 90;
      }
    }

    return 0;
  }

  private static calculateRegionMatch(
    desiredLocations: string[],
    jobProvince: string,
    jobRegion: string
  ): number {
    if (!jobProvince || !jobRegion || desiredLocations.length === 0) return 0;

    for (const desiredLocation of desiredLocations) {
      const desiredLower = desiredLocation.toLowerCase().trim();

      const regionInfo = getRegionForProvince(desiredLocation);
      if (regionInfo && regionInfo.region === jobRegion) {
        return 80;
      }

      if (areProvincesInSameRegion(desiredLocation, jobProvince)) {
        return 85;
      }
    }

    return 0;
  }

  private static calculateSalaryMatch(
    salaryRange: { min: number; max: number; salaryType: string },
    job: any
  ): number {
    if (salaryRange.min === 0 && salaryRange.max === 0) {
      return 50;
    }

    const jobSalary = this.parseJobSalary(job.salary);
    if (jobSalary === 0) {
      return 50;
    }

    const userMin = salaryRange.min;
    const userMax = salaryRange.max;

    if (jobSalary >= userMin && jobSalary <= userMax) {
      return 100;
    }

    const threshold = Math.max(userMin * 0.2, 100);
    const lowerBound = userMin - threshold;
    const upperBound = userMax + threshold;

    if (jobSalary >= lowerBound && jobSalary <= upperBound) {
      return 80;
    }

    if (jobSalary > upperBound) {
      return 70;
    }

    if (jobSalary < lowerBound) {
      return 40;
    }

    return 50;
  }

  private static parseJobSalary(salaryString: string): number {
    if (!salaryString) return 0;

    const match = salaryString.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, "")) : 0;
  }

  private static calculateLanguageMatch(
    preferredLanguages: string[],
    requiredLanguages: string[]
  ): number {
    if (!requiredLanguages || requiredLanguages.length === 0) {
      return 100;
    }

    if (preferredLanguages.length === 0) {
      return 50;
    }

    const overlap = preferredLanguages.filter((lang) =>
      requiredLanguages.includes(lang)
    );

    if (overlap.length === 0) {
      return 30;
    }

    return (overlap.length / requiredLanguages.length) * 100;
  }

  private static generateMatchReasons(breakdown: any): string[] {
    const reasons: string[] = [];

    if (breakdown.jobTitle === 100) {
      reasons.push("Job type matches your preferences");
    }

    if (breakdown.jobType === 100) {
      reasons.push("Work arrangement matches your preferences");
    } else if (breakdown.jobType >= 60) {
      reasons.push("Work arrangement is close to your preferences");
    }

    if (breakdown.location === 100) {
      reasons.push("Location matches your preferences");
    } else if (breakdown.location >= 50) {
      reasons.push("Location is outside your preferred areas");
    }

    if (breakdown.salary >= 80) {
      reasons.push("Salary meets your expectations");
    } else if (breakdown.salary >= 60) {
      reasons.push("Salary is close to your expectations");
    } else if (breakdown.salary >= 40) {
      reasons.push("Salary is below your expectations");
    }

    if (breakdown.languages >= 80) {
      reasons.push("Language requirements match your skills");
    } else if (breakdown.languages >= 30) {
      reasons.push("Some language requirements may not match");
    }

    if (breakdown.skills >= 80) {
      reasons.push("Your skills match the job requirements");
    } else if (breakdown.skills >= 60) {
      reasons.push("Most of your skills match the job requirements");
    } else if (breakdown.skills >= 40) {
      reasons.push("Some of your skills match the job requirements");
    } else if (breakdown.skills > 0) {
      reasons.push("Few of your skills match the job requirements");
    }

    if (breakdown.priority >= 80) {
      reasons.push("High priority job");
    } else if (breakdown.priority >= 60) {
      reasons.push("Good priority job");
    }

    return reasons;
  }
}

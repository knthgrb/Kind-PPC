import { createClient } from "@/utils/supabase/client";
import { JobPost, SalaryRate } from "@/types/jobPosts";

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
   * Fetch job by ID (client-side)
   */
  async fetchById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_posts")
      .select(
        "id, kindbossing_user_id, job_title, job_description, job_type, location, salary_min, salary_max, salary_type, created_at, updated_at, status"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return null;
    }

    return data ? JSON.parse(JSON.stringify(data)) : null;
  },

  /**
   * Fetch jobs with filters (client-side)
   */
  async fetchJobsClient(filters?: JobFilters): Promise<JobPost[]> {
    const supabase = createClient();

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

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }

    // Convert job_posts schema to JobPost format
    const jobs = (data ?? []).map((job) => ({
      id: String(job.id),
      kindbossing_user_id: String(job.kindbossing_user_id),
      job_title: String(job.job_title),
      job_description: String(job.job_description || ""),
      job_type: job.job_type as any,
      location: String(job.location),
      salary: String(job.salary || "0"),
      required_skills: job.required_skills || [],
      work_schedule: job.work_schedule || null,
      required_years_of_experience: job.required_years_of_experience || 0,
      preferred_languages: job.preferred_languages || [],
      is_boosted: job.is_boosted || false,
      boost_expires_at: job.boost_expires_at,
      status: job.status as "active" | "paused" | "closed",
      created_at: String(job.created_at),
      updated_at: String(job.updated_at),
    }));

    return jobs;
  },

  /**
   * Parse salary range string (e.g., "15000-25000", "20000+", "<30000")
   */
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

  /**
   * Fetch matched jobs for a user (client-side)
   * Uses the same matching algorithm as server-side
   */
  async fetchMatchedJobsClient(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    // Use the server-side matching service for consistency
    const response = await fetch(
      `/api/jobs/matched?userId=${userId}&limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching matched jobs:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.jobs || [];
  },

  /**
   * Fetch job filter options (client-side)
   */
  async fetchJobFilterOptions(): Promise<JobFilterOptions> {
    const supabase = createClient();

    // Fetch unique locations
    const { data: locationsData } = await supabase
      .from("job_posts")
      .select("location")
      .eq("status", "active")
      .not("location", "is", null);

    // Fetch unique job types
    const { data: jobTypesData } = await supabase
      .from("job_posts")
      .select("job_type")
      .eq("status", "active")
      .not("job_type", "is", null);

    // Extract provinces from locations
    const provincesSet = new Set<string>();
    (locationsData ?? []).forEach((item: { location?: string }) => {
      if (item.location) {
        // Extract province from location string
        const parts = item.location.split(",").map((p) => p.trim());
        const province = parts[parts.length - 1]; // Assume province is the last part
        if (province) provincesSet.add(province);
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
      ...Array.from(new Set(jobTypesData?.map((item) => item.job_type) || [])),
    ];

    return {
      provinces,
      jobTypes,
    };
  },

  /**
   * Filter jobs by radius using Haversine formula
   */
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
  },

  /**
   * Extract province from location string
   */
  extractProvinceFromLocation(location: string): string | null {
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
  },

  /**
   * Calculate distance between two coordinates using Haversine formula
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

  /**
   * Convert degrees to radians
   */
  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  /**
   * Fetch jobs posted by a specific employer
   */
  async fetchMyJobs(employerId: string): Promise<JobPost[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("kindbossing_user_id", employerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching my jobs:", error);
      return [];
    }

    return data || [];
  },
};

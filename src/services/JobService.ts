import { createClient } from "@/utils/supabase/server";
import { createClient as createClientClient } from "@/utils/supabase/client";
import { JobPost, SalaryRate } from "@/types/jobPosts";
import { JobMatchingService, JobWithMatchingScore } from "./JobMatchingService";

export type JobFilters = {
  location?: string;
  jobType?: string;
  payType?: SalaryRate | "All";
  keyword?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  page?: number; // 1-based, alternative to offset
};

export type JobFilterOptions = {
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
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
        "id, family_id, title, description, job_type, location, salary_min, salary_max, salary_rate, created_at, updated_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return null;
    }

    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

  /**
   * Fetch jobs with filters (server-side)
   */
  static async fetchJobs(filters?: JobFilters): Promise<JobPost[]> {
    const supabase = await createClient();

    let query = supabase
      .from("job_posts")
      .select(
        "id, family_id, title, description, job_type, location, salary_min, salary_max, salary_rate, created_at, updated_at"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.location && filters.location !== "All") {
      query = query.eq("location", filters.location);
    }
    if (filters?.jobType && filters.jobType !== "All") {
      query = query.eq("job_type", filters.jobType);
    }
    if (filters?.payType && filters.payType !== "All") {
      query = query.eq("salary_rate", filters.payType as SalaryRate);
    }

    // Handle keyword and tags search
    const keywordInput = (
      (filters?.keyword ?? "").trim() || (filters?.tags ?? []).join(" ")
    ).trim();
    if (keywordInput.length > 0) {
      const kw = keywordInput.replace(/%/g, "");
      query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%`);
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

    return data ?? [];
  }

  /**
   * Fetch jobs with filters (client-side)
   */
  static async fetchJobsClient(filters?: JobFilters): Promise<JobPost[]> {
    const supabase = createClientClient();

    let query = supabase
      .from("job_posts")
      .select(
        "id, family_id, title, description, job_type, location, salary_min, salary_max, salary_rate, created_at, updated_at"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Apply filters (same logic as server function)
    if (filters?.location && filters.location !== "All") {
      query = query.eq("location", filters.location);
    }
    if (filters?.jobType && filters.jobType !== "All") {
      query = query.eq("job_type", filters.jobType);
    }
    if (filters?.payType && filters.payType !== "All") {
      query = query.eq("salary_rate", filters.payType as SalaryRate);
    }

    // Handle keyword and tags search
    const keywordInput = (
      (filters?.keyword ?? "").trim() || (filters?.tags ?? []).join(" ")
    ).trim();
    if (keywordInput.length > 0) {
      const kw = keywordInput.replace(/%/g, "");
      query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%`);
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

    return data ?? [];
  }

  /**
   * Fetch job posts by kindBossing user
   */
  static async fetchJobPostsByKindBossing(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("active_job_posts")
      .select("*")
      .eq("family_id", userId);

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
      .from("active_job_posts")
      .select("*", { count: "exact" })
      .eq("family_id", userId) // match what we insert
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
        supabase.from("job_posts").select("location").eq("is_active", true),
        supabase.from("job_posts").select("job_type").eq("is_active", true),
      ]
    );

    const locationsSet = new Set<string>();
    (locationsData ?? []).forEach((row: { location?: string }) => {
      if (row.location) locationsSet.add(row.location);
    });
    const jobTypesSet = new Set<string>();
    (jobTypesData ?? []).forEach((row: { job_type?: string }) => {
      if (row.job_type) jobTypesSet.add(row.job_type);
    });

    const locations = [
      "All",
      ...Array.from(locationsSet).sort((a, b) => a.localeCompare(b)),
    ];
    const jobTypes = [
      "All",
      ...Array.from(jobTypesSet).sort((a, b) => a.localeCompare(b)),
    ];
    const payTypes = ["All", "Per Hour", "Per Day", "Per Week", "Per Month"];

    return { locations, jobTypes, payTypes };
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
  ): Promise<JobWithMatchingScore[]> {
    return JobMatchingService.getMatchedJobs(userId, limit, offset);
  }

  /**
   * Fetch matched jobs for KindTao users using matching algorithm (client-side)
   */
  static async fetchMatchedJobsClient(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JobWithMatchingScore[]> {
    return JobMatchingService.getMatchedJobsClient(userId, limit, offset);
  }
}

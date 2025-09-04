import { createClient } from "@/utils/supabase/server";
import { createClient as createClientClient } from "@/utils/supabase/client";
import { JobPost, SalaryRate } from "@/types/jobPosts";

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

// Server-side function (for initial data fetching)
export async function fetchJobs(filters?: JobFilters): Promise<JobPost[]> {
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

// Client-side function (for dynamic loading)
export async function fetchJobsClient(
  filters?: JobFilters
): Promise<JobPost[]> {
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

// Get filter options
export async function fetchJobFilterOptions(): Promise<JobFilterOptions> {
  const supabase = await createClient();

  const [{ data: locationsData }, { data: jobTypesData }] = await Promise.all([
    supabase.from("job_posts").select("location").eq("is_active", true),
    supabase.from("job_posts").select("job_type").eq("is_active", true),
  ]);

  const locationsSet = new Set<string>();
  (locationsData ?? []).forEach((row: any) => {
    if (row.location) locationsSet.add(row.location as string);
  });
  const jobTypesSet = new Set<string>();
  (jobTypesData ?? []).forEach((row: any) => {
    if (row.job_type) jobTypesSet.add(row.job_type as string);
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

// Convenience function for latest jobs
export async function fetchLatestJobs(
  limit: number = 8,
  filters?: Omit<JobFilters, "limit" | "offset" | "page">
): Promise<JobPost[]> {
  return fetchJobs({ ...filters, limit });
}

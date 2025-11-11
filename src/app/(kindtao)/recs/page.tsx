import { JobService } from "@/services/server/JobService";
import { SwipeService } from "@/services/server/SwipeService";
import FindWorkClient from "./_components/FindWorkClient";
import { UserService } from "@/services/server/UserService";
import { redirect } from "next/navigation";

const PAGE_SIZE = 20;

export default async function FindWorkPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  // Await searchParams as required by Next.js 15
  const resolvedSearchParams = await searchParams;

  // Get current user
  const { data: user, error: authError } = await UserService.getCurrentUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Create initialFilters from resolvedSearchParams for the search component
  const initialFilters = {
    search: resolvedSearchParams.search || "",
    province: resolvedSearchParams.province || "All",
    radius: parseInt(resolvedSearchParams.radius) || 50,
    jobType: resolvedSearchParams.jobType || "All",
  };

  // Serialize initialFilters to ensure it's a plain object
  const serializedInitialFilters = JSON.parse(JSON.stringify(initialFilters));

  // Get user location for radius filtering
  const userLocation = await UserService.getUserLocation(user.id);

  // Fetch matched jobs using the matching algorithm and swipe limit status
  const [matchedJobs, filterOptions, swipeLimitStatus] = await Promise.all([
    JobService.fetchMatchedJobs(user.id, PAGE_SIZE, 0),
    JobService.fetchJobFilterOptions(),
    SwipeService.getSwipeLimitStatus(user.id),
  ]);

  // Convert matched jobs to plain objects for client components
  const jobs = matchedJobs.map((match) => ({
    id: String(match.jobId),
    kindbossing_user_id: String(match.job?.kindbossing_user_id || ""),
    job_title: String(match.job?.job_title || ""),
    job_description: String(match.job?.job_description || ""),
    job_type: match.job?.job_type ? String(match.job.job_type) : null,
    location: String(match.job?.location || ""),
    salary: String(match.job?.salary || ""),
    salary_type: String(match.job?.salary_type || ""),
    required_skills: Array.isArray(match.job?.required_skills)
      ? match.job.required_skills
      : [],
    work_schedule: match.job?.work_schedule || {},
    required_years_of_experience: Number(
      match.job?.required_years_of_experience || 0
    ),
    preferred_languages: Array.isArray(match.job?.preferred_languages)
      ? match.job.preferred_languages
      : [],
    is_boosted: Boolean(match.job?.is_boosted),
    boost_expires_at: match.job?.boost_expires_at
      ? String(match.job.boost_expires_at)
      : null,
    status: String(match.job?.status || "active"),
    created_at: String(match.job?.created_at || ""),
    updated_at: String(match.job?.updated_at || ""),
  }));

  // Convert matching scores to plain objects
  const matchingScores = matchedJobs.map((match) => ({
    jobId: String(match.jobId),
    score: Number(match.score),
    reasons: Array.isArray(match.reasons) ? match.reasons.map(String) : [],
    breakdown: {
      jobTitle: Number(match.breakdown.jobTitle),
      jobType: Number(match.breakdown.jobType),
      location: Number(match.breakdown.location),
      salary: Number(match.breakdown.salary),
      languages: Number(match.breakdown.languages),
    },
  }));

  // Ensure all data is properly serialized by using JSON.parse(JSON.stringify())
  const serializedJobs = JSON.parse(JSON.stringify(jobs));
  const serializedMatchingScores = JSON.parse(JSON.stringify(matchingScores));

  // Ensure filterOptions are properly serialized
  const serializedFilterOptions = {
    provinces: Array.isArray(filterOptions.provinces)
      ? filterOptions.provinces.map(String)
      : [],
    jobTypes: Array.isArray(filterOptions.jobTypes)
      ? filterOptions.jobTypes.map(String)
      : [],
  };

  // Serialize swipe limit status
  const serializedSwipeLimit = JSON.parse(
    JSON.stringify({
      remainingSwipes: Number(swipeLimitStatus.remainingSwipes),
      dailyLimit: Number(swipeLimitStatus.dailyLimit),
      canSwipe: Boolean(swipeLimitStatus.canSwipe),
    })
  );

  // Ensure all data is completely serializable
  const finalJobs = JSON.parse(JSON.stringify(serializedJobs));
  const finalMatchingScores = JSON.parse(
    JSON.stringify(serializedMatchingScores)
  );
  const finalSwipeLimit = JSON.parse(JSON.stringify(serializedSwipeLimit));
  const finalFilterOptions = JSON.parse(
    JSON.stringify(serializedFilterOptions)
  );
  const finalInitialFilters = JSON.parse(
    JSON.stringify(serializedInitialFilters)
  );

  return (
    <FindWorkClient
      initialJobs={finalJobs}
      initialMatchingScores={finalMatchingScores}
      provinces={finalFilterOptions.provinces}
      jobTypes={finalFilterOptions.jobTypes}
      initialFilters={finalInitialFilters}
      initialSwipeLimit={finalSwipeLimit}
      currentPlan={"free"}
    />
  );
}

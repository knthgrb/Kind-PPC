import { JobService } from "@/services/JobService";
import { SwipeService } from "@/services/SwipeService";
import JobsCarousel from "./_components/JobsCarousel";
import JobSwipeWrapper from "./_components/JobSwipeWrapper";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 20;

export default async function FindWorkPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  // Await searchParams as required by Next.js 15
  const resolvedSearchParams = await searchParams;

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600">Please log in to view job matches.</p>
        </div>
      </div>
    );
  }

  // Check if user has completed onboarding (has helper profile)
  const { data: helperProfile, error: profileError } = await supabase
    .from("helper_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !helperProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complete Your Profile
          </h2>
          <p className="text-gray-600 mb-4">
            Please complete your profile to view job matches.
          </p>
          <a
            href="/kindtao-onboarding/personal-info"
            className="inline-block px-6 py-3 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Complete Profile
          </a>
        </div>
      </div>
    );
  }

  // Create initialFilters from resolvedSearchParams for the search component
  const initialFilters = {
    tags: resolvedSearchParams.tags ? resolvedSearchParams.tags.split(",") : [],
    location: resolvedSearchParams.location || "All",
    jobType: resolvedSearchParams.jobType || "All",
    payType: resolvedSearchParams.payType || "All",
    keyword: resolvedSearchParams.keyword || "",
  };

  // Serialize initialFilters to ensure it's a plain object
  const serializedInitialFilters = JSON.parse(JSON.stringify(initialFilters));

  // Fetch matched jobs using the matching algorithm and swipe limit status
  const [matchedJobs, filterOptions, swipeLimitStatus] = await Promise.all([
    JobService.fetchMatchedJobs(user.id, PAGE_SIZE, 0),
    JobService.fetchJobFilterOptions(),
    SwipeService.getSwipeLimitStatus(user.id),
  ]);

  // Convert matched jobs to plain objects for client components
  const jobs = matchedJobs.map((job) => ({
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
  }));

  // Convert matching scores to plain objects
  const matchingScores = matchedJobs.map((job) => ({
    jobId: String(job.matchingScore.jobId),
    score: Number(job.matchingScore.score),
    reasons: Array.isArray(job.matchingScore.reasons)
      ? job.matchingScore.reasons.map(String)
      : [],
    breakdown: {
      jobTypeMatch: Number(job.matchingScore.breakdown.jobTypeMatch),
      locationMatch: Number(job.matchingScore.breakdown.locationMatch),
      salaryMatch: Number(job.matchingScore.breakdown.salaryMatch),
      skillsMatch: Number(job.matchingScore.breakdown.skillsMatch),
      experienceMatch: Number(job.matchingScore.breakdown.experienceMatch),
      availabilityMatch: Number(job.matchingScore.breakdown.availabilityMatch),
      ratingBonus: Number(job.matchingScore.breakdown.ratingBonus),
      recencyBonus: Number(job.matchingScore.breakdown.recencyBonus),
    },
  }));

  // Ensure all data is properly serialized by using JSON.parse(JSON.stringify())
  const serializedJobs = JSON.parse(JSON.stringify(jobs));
  const serializedMatchingScores = JSON.parse(JSON.stringify(matchingScores));

  // Ensure filterOptions are properly serialized
  const serializedFilterOptions = {
    locations: Array.isArray(filterOptions.locations)
      ? filterOptions.locations.map(String)
      : [],
    jobTypes: Array.isArray(filterOptions.jobTypes)
      ? filterOptions.jobTypes.map(String)
      : [],
    payTypes: Array.isArray(filterOptions.payTypes)
      ? filterOptions.payTypes.map(String)
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
    <section>
      {/* Mobile swipe */}
      <div className="block sm:hidden">
        <JobSwipeWrapper
          initialJobs={finalJobs}
          pageSize={Number(PAGE_SIZE)}
          locations={finalFilterOptions.locations}
          jobTypes={finalFilterOptions.jobTypes}
          payTypes={finalFilterOptions.payTypes}
          initialFilters={finalInitialFilters}
          initialSwipeLimit={finalSwipeLimit}
        />
      </div>

      {/* Desktop carousel */}
      <div className="hidden sm:block">
        <JobsCarousel
          jobs={finalJobs}
          matchingScores={finalMatchingScores}
          initialSwipeLimit={finalSwipeLimit}
        />
      </div>
    </section>
  );
}

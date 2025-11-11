"use client";

import { JobPost } from "@/types/jobPosts";
import DesktopJobSwipe from "./DesktopJobSwipe";

type MatchingScore = {
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
};

type Props = {
  jobs: JobPost[];
  matchingScores?: MatchingScore[];
  initialSwipeLimit?: {
    remainingSwipes: number;
    dailyLimit: number;
    canSwipe: boolean;
  };
  onOpenFilters?: () => void;
  onOpenJobPreferences?: () => void;
};

export default function JobsCarousel({
  jobs,
  matchingScores = [],
  initialSwipeLimit,
  onOpenFilters,
  onOpenJobPreferences,
}: Props) {
  const PAGE_SIZE = 24;

  return (
    <DesktopJobSwipe
      initialJobs={jobs}
      initialMatchingScores={matchingScores}
      pageSize={PAGE_SIZE}
      initialSwipeLimit={initialSwipeLimit}
      onOpenFilters={onOpenFilters}
      onOpenJobPreferences={onOpenJobPreferences}
    />
  );
}

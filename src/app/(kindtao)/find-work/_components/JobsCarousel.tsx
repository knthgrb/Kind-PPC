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
};

export default function JobsCarousel({
  jobs,
  matchingScores = [],
}: Props) {
  const PAGE_SIZE = 24;

  const handleApply = (job: JobPost) => {
    console.log("Apply:", job);
    // TODO: Implement actual apply logic
  };

  const handleSkip = (job: JobPost) => {
    console.log("Skip:", job);
    // TODO: Implement actual skip logic
  };

  return (
    <section className="px-4">
      <DesktopJobSwipe
        initialJobs={jobs}
        initialMatchingScores={matchingScores}
        pageSize={PAGE_SIZE}
        onApply={handleApply}
        onSkip={handleSkip}
      />
    </section>
  );
}

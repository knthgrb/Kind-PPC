"use client";

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

interface MatchingScoreDisplayProps {
  score: MatchingScore;
  showDetails?: boolean;
}

export default function MatchingScoreDisplay({
  score,
  showDetails = false,
}: MatchingScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Poor Match";
  };

  return (
    <div className="space-y-2">
      {/* Score Badge */}
      <div className="flex items-center space-x-2">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(
            score.score
          )}`}
        >
          {score.score}% - {getScoreLabel(score.score)}
        </span>
      </div>

      {/* Reasons */}
      {score.reasons.length > 0 && (
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Why this job matches you:</p>
          <ul className="space-y-1">
            {score.reasons.map((reason, index) => (
              <li key={index} className="flex items-start">
                <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-2 mr-2 shrink-0"></span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Breakdown (only if showDetails is true) */}
      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Detailed Breakdown:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Job Type:</span>
              <span className="font-medium">
                {score.breakdown.jobTypeMatch}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-medium">
                {Math.round(score.breakdown.locationMatch)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Salary:</span>
              <span className="font-medium">
                {Math.round(score.breakdown.salaryMatch)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Skills:</span>
              <span className="font-medium">
                {Math.round(score.breakdown.skillsMatch)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Experience:</span>
              <span className="font-medium">
                {Math.round(score.breakdown.experienceMatch)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Availability:</span>
              <span className="font-medium">
                {Math.round(score.breakdown.availabilityMatch)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rating Bonus:</span>
              <span className="font-medium">
                {Math.round(score.breakdown.ratingBonus)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Recency Bonus:</span>
              <span className="font-medium">
                {Math.round(score.breakdown.recencyBonus)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

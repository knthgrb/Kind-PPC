import { NextRequest, NextResponse } from "next/server";
import { JobService } from "@/services/server/JobService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Use the server-side matching service
    const matchedJobs = await JobService.fetchMatchedJobs(
      userId,
      limit,
      offset
    );

    // Convert to the format expected by the client
    const jobs = matchedJobs.map((match) => ({
      id: String(match.jobId),
      kindbossing_user_id: String(match.job?.kindbossing_user_id || ""),
      job_title: String(match.job?.job_title || ""),
      job_description: String(match.job?.job_description || ""),
      job_type: match.job?.job_type ? String(match.job.job_type) : null,
      location: String(match.job?.location || ""),
      salary: String(match.job?.salary || ""),
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
      matchingScore: {
        jobId: String(match.jobId),
        score: Number(match.score),
        reasons: Array.isArray(match.reasons) ? match.reasons.map(String) : [],
        breakdown: {
          jobTypeMatch: Number(match.breakdown.jobType),
          locationMatch: Number(match.breakdown.location),
          salaryMatch: Number(match.breakdown.salary),
          skillsMatch: Number(match.breakdown.skills),
          experienceMatch: 0,
          availabilityMatch: 0,
          ratingBonus: 0,
          recencyBonus: 0,
        },
      },
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error in matched jobs API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

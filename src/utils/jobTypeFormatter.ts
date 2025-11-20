/**
 * Utility to format job types for display
 * Normalizes job type strings to proper capitalization
 */

export function formatJobType(jobType: string | null | undefined): string {
  if (!jobType) return "";

  // Handle hyphenated types (e.g., "full-time" -> "Full-time")
  if (jobType.includes("-")) {
    return jobType
      .split("-")
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.toLowerCase();
      })
      .join("-");
  }

  // Handle underscore types (e.g., "all_around" -> "All Around")
  if (jobType.includes("_")) {
    return jobType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Handle single words (e.g., "daily" -> "Daily")
  return jobType.charAt(0).toUpperCase() + jobType.slice(1).toLowerCase();
}


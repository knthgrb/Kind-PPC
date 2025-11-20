/**
 * Utility to assign job-specific colors and icons based on job title
 */

export interface JobCardStyle {
  gradientFrom: string;
  gradientTo: string;
  icon: string;
}

/**
 * Get job card style based on job title
 */
export function getJobCardStyle(jobTitle: string): JobCardStyle {
  const title = jobTitle.toLowerCase();

  // Plumber / Plumbing
  if (title.includes("plumb") || title.includes("tubero")) {
    return {
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-700",
      icon: "🔧",
    };
  }

  // Driver
  if (title.includes("driver") || title.includes("chofer")) {
    return {
      gradientFrom: "from-gray-600",
      gradientTo: "to-gray-800",
      icon: "🚗",
    };
  }

  // Cook / Kitchen
  if (
    title.includes("cook") ||
    title.includes("kusinera") ||
    title.includes("kusinero") ||
    title.includes("kitchen")
  ) {
    return {
      gradientFrom: "from-orange-500",
      gradientTo: "to-orange-700",
      icon: "👨‍🍳",
    };
  }

  // Nanny / Yaya / Childcare
  if (
    title.includes("nanny") ||
    title.includes("yaya") ||
    title.includes("babysit") ||
    title.includes("childcare")
  ) {
    return {
      gradientFrom: "from-pink-400",
      gradientTo: "to-pink-600",
      icon: "👶",
    };
  }

  // Caregiver / Elderly Care
  if (
    title.includes("caregiver") ||
    title.includes("bantay") ||
    title.includes("elderly") ||
    title.includes("nurse")
  ) {
    return {
      gradientFrom: "from-green-500",
      gradientTo: "to-green-700",
      icon: "👴",
    };
  }

  // Housekeeper / Cleaning
  if (
    title.includes("housekeep") ||
    title.includes("clean") ||
    title.includes("tagalinis") ||
    title.includes("kasambahay")
  ) {
    return {
      gradientFrom: "from-cyan-500",
      gradientTo: "to-cyan-700",
      icon: "🧹",
    };
  }

  // Gardener
  if (title.includes("garden") || title.includes("hardinero")) {
    return {
      gradientFrom: "from-emerald-500",
      gradientTo: "to-emerald-700",
      icon: "🌿",
    };
  }

  // Security / Guard
  if (
    title.includes("security") ||
    title.includes("guard") ||
    title.includes("guwardiya")
  ) {
    return {
      gradientFrom: "from-slate-600",
      gradientTo: "to-slate-800",
      icon: "🛡️",
    };
  }

  // Painter
  if (title.includes("paint") || title.includes("pintor")) {
    return {
      gradientFrom: "from-purple-500",
      gradientTo: "to-purple-700",
      icon: "🎨",
    };
  }

  // Welder
  if (title.includes("weld")) {
    return {
      gradientFrom: "from-amber-600",
      gradientTo: "to-amber-800",
      icon: "⚡",
    };
  }

  // Mason
  if (title.includes("mason") || title.includes("meison")) {
    return {
      gradientFrom: "from-stone-600",
      gradientTo: "to-stone-800",
      icon: "🧱",
    };
  }

  // Tutor / Teacher
  if (title.includes("tutor") || title.includes("teach")) {
    return {
      gradientFrom: "from-indigo-500",
      gradientTo: "to-indigo-700",
      icon: "📚",
    };
  }

  // Laundry
  if (title.includes("laundry") || title.includes("labandera")) {
    return {
      gradientFrom: "from-sky-400",
      gradientTo: "to-sky-600",
      icon: "👕",
    };
  }

  // Massage / Hilot
  if (title.includes("massage") || title.includes("hilot")) {
    return {
      gradientFrom: "from-rose-400",
      gradientTo: "to-rose-600",
      icon: "💆",
    };
  }

  // Handyman / All-around
  if (
    title.includes("handyman") ||
    title.includes("all-around") ||
    title.includes("karpintero") ||
    title.includes("all_around")
  ) {
    return {
      gradientFrom: "from-teal-500",
      gradientTo: "to-teal-700",
      icon: "🔨",
    };
  }

  // Aircon / HVAC
  if (title.includes("aircon") || title.includes("hvac")) {
    return {
      gradientFrom: "from-cyan-400",
      gradientTo: "to-cyan-600",
      icon: "❄️",
    };
  }

  // Default style (red to pink)
  return {
    gradientFrom: "from-red-500",
    gradientTo: "to-pink-500",
    icon: "💼",
  };
}


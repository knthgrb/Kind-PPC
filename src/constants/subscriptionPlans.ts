import { SubscriptionPlan } from "@/types/subscription";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Free Plans
  {
    id: "free_kindbossing",
    name: "Free",
    tier: "free",
    userRole: "kindbossing",
    priceMonthly: 0,
    currency: "PHP",
    description: "Perfect for trying out the platform",
    features: [
      "Browse up to 5 kindTao profiles",
      "Post 1 job per month",
      "Basic messaging",
      "Community support",
      "Basic profile visibility",
    ],
    swipeCreditsMonthly: 10,
    boostCreditsMonthly: 0,
    isActive: true,
    metadata: {
      maxJobPosts: 1,
      maxProfileViews: 5,
      hasPrioritySupport: false,
      hasAdvancedAnalytics: false,
    },
  },
  {
    id: "free_kindtao",
    name: "Free",
    tier: "free",
    userRole: "kindtao",
    priceMonthly: 0,
    currency: "PHP",
    description: "Start your journey as a helper",
    features: [
      "Apply to 10 jobs per day",
      "Basic profile visibility",
      "Standard messaging",
      "Community support",
      "Basic skill showcase",
    ],
    swipeCreditsMonthly: 10,
    boostCreditsMonthly: 10,
    isActive: true,
    metadata: {
      maxDailyApplications: 10,
      maxProfileViews: 5,
      hasPrioritySupport: false,
      hasAdvancedAnalytics: false,
    },
  },

  // Basic Plans
  {
    id: "basic_kindbossing",
    name: "Basic",
    tier: "basic",
    userRole: "kindbossing",
    priceMonthly: 199,
    currency: "PHP",
    description: "Perfect for regular household hiring needs",
    features: [
      "10 swipe credits per day",
      "Unlimited access to verified kindTao profiles",
      "Unlimited job postings",
      "Direct messaging with kindTao",
      "Priority customer support",
      "10 boost credits per month",
      "Advanced search filters",
      "Background check reports",
    ],
    swipeCreditsMonthly: 10,
    boostCreditsMonthly: 10,
    isActive: true,
    isPopular: true,
    metadata: {
      maxJobPosts: -1, // unlimited
      maxProfileViews: -1, // unlimited
      hasPrioritySupport: true,
      hasAdvancedAnalytics: true,
      hasBackgroundChecks: true,
    },
  },
  {
    id: "basic_kindtao",
    name: "Basic",
    tier: "basic",
    userRole: "kindtao",
    priceMonthly: 199,
    currency: "PHP",
    description: "Boost your profile and get more opportunities",
    features: [
      "10 swipe credits per day",
      "Unlimited job applications",
      "10 boost credits per month",
      "Priority in search results",
      "Advanced profile features",
      "Direct messaging with employers",
      "Skill verification badges",
      "Performance analytics",
    ],
    swipeCreditsMonthly: 10,
    boostCreditsMonthly: 10,
    isActive: true,
    isPopular: true,
    metadata: {
      maxDailyApplications: -1, // unlimited
      maxProfileViews: -1, // unlimited
      hasPrioritySupport: true,
      hasAdvancedAnalytics: true,
      hasSkillVerification: true,
    },
  },

  // Premium Plans
  {
    id: "premium_kindbossing",
    name: "Premium",
    tier: "premium",
    userRole: "kindbossing",
    priceMonthly: 399,
    currency: "PHP",
    description: "For families with multiple hiring needs",
    features: [
      "Unlimited swipe credits",
      "Everything in Basic",
      "Unlimited profile boosts",
      "Priority job posting",
      "Advanced HR tools",
      "Payroll management",
      "Compliance tracking",
      "Dedicated account manager",
      "Custom reporting",
    ],
    swipeCreditsMonthly: -1, // -1 represents unlimited
    boostCreditsMonthly: -1, // unlimited boosts
    isActive: true,
    metadata: {
      maxJobPosts: -1,
      maxProfileViews: -1,
      hasPrioritySupport: true,
      hasAdvancedAnalytics: true,
      hasBackgroundChecks: true,
      hasHRTools: true,
      hasPayrollManagement: true,
      hasDedicatedSupport: true,
    },
  },
  {
    id: "premium_kindtao",
    name: "Premium",
    tier: "premium",
    userRole: "kindtao",
    priceMonthly: 399,
    currency: "PHP",
    description: "Maximize your earning potential",
    features: [
      "Unlimited swipe credits",
      "Everything in Basic",
      "Unlimited profile boosts",
      "Top priority in search results",
      "Advanced skill assessments",
      "Professional development tools",
      "Income tracking",
      "Tax document generation",
      "Career coaching sessions",
    ],
    swipeCreditsMonthly: -1, // -1 represents unlimited
    boostCreditsMonthly: -1, // unlimited boosts
    isActive: true,
    metadata: {
      maxDailyApplications: -1,
      maxProfileViews: -1,
      hasPrioritySupport: true,
      hasAdvancedAnalytics: true,
      hasSkillVerification: true,
      hasCareerCoaching: true,
      hasTaxDocuments: true,
    },
  },
];

// Boost packages for one-time purchases
export const BOOST_PACKAGES = {
  boost_credits: [
    {
      id: "boost_1",
      name: "Profile Boost (1)",
      type: "boost_credits" as const,
      quantity: 1,
      price: 49,
      currency: "PHP",
      description: "Boost your profile for 24 hours",
      duration: 24, // hours
    },
    {
      id: "boost_3",
      name: "Profile Boost (3)",
      type: "boost_credits" as const,
      quantity: 3,
      price: 129,
      currency: "PHP",
      description: "3 profile boosts - save 12%",
      duration: 24, // hours each
    },
    {
      id: "boost_5",
      name: "Profile Boost (5)",
      type: "boost_credits" as const,
      quantity: 5,
      price: 199,
      currency: "PHP",
      description: "5 profile boosts - save 19%",
      duration: 24, // hours each
    },
  ],
  swipe_credits: [
    {
      id: "swipe_10",
      name: "Swipe Credits (10)",
      type: "swipe_credits" as const,
      quantity: 10,
      price: 99,
      currency: "PHP",
      description: "10 additional swipe credits",
    },
    {
      id: "swipe_25",
      name: "Swipe Credits (25)",
      type: "swipe_credits" as const,
      quantity: 25,
      price: 199,
      currency: "PHP",
      description: "25 additional swipe credits - save 20%",
    },
    {
      id: "swipe_unlimited",
      name: "Unlimited Swipes",
      type: "swipe_credits" as const,
      quantity: -1, // -1 represents unlimited
      price: 399,
      currency: "PHP",
      description: "Unlimited swipe credits - best value!",
    },
  ],
};

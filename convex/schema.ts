import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - main user data
  users: defineTable({
    id: v.string(), // Better Auth user ID
    email: v.string(),
    role: v.union(
      v.literal("kindbossing"),
      v.literal("kindtao"),
      v.literal("admin")
    ),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    gender: v.optional(v.string()),
    profile_image_url: v.optional(v.union(v.string(), v.null())),
    barangay: v.optional(v.string()),
    municipality: v.optional(v.string()),
    province: v.optional(v.string()),
    zip_code: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("suspended")
      )
    ),
    swipe_credits: v.optional(v.number()),
    boost_credits: v.optional(v.number()),
    location_coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    last_seen_at: v.optional(v.number()),
    has_completed_onboarding: v.optional(v.boolean()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["id"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // KindTao profiles
  kindtaos: defineTable({
    user_id: v.string(),
    skills: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    expected_salary_range: v.optional(v.string()),
    availability_schedule: v.optional(v.any()),
    highest_educational_attainment: v.optional(v.string()),
    rating: v.optional(v.number()),
    reviews: v.optional(v.array(v.string())),
    is_verified: v.optional(v.boolean()),
    is_boosted: v.optional(v.boolean()),
    boost_expires_at: v.optional(v.number()),
    created_at: v.number(),
  }).index("by_user_id", ["user_id"]),

  // KindBossing profiles
  kindbossings: defineTable({
    user_id: v.string(),
    rating: v.optional(v.number()),
    reviews: v.optional(v.array(v.string())),
    business_name: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_user_id", ["user_id"]),

  // Job Posts
  job_posts: defineTable({
    kindbossing_user_id: v.string(),
    job_title: v.string(),
    job_description: v.optional(v.string()),
    required_skills: v.optional(v.array(v.string())),
    salary: v.optional(v.string()),
    salary_min: v.optional(v.number()),
    salary_max: v.optional(v.number()),
    salary_type: v.optional(v.string()),
    work_schedule: v.any(),
    required_years_of_experience: v.optional(v.number()),
    location: v.string(),
    location_coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    preferred_languages: v.optional(v.array(v.string())),
    status: v.string(),
    job_type: v.string(),
    is_boosted: v.optional(v.boolean()),
    boost_expires_at: v.optional(v.number()),
    expires_at: v.optional(v.number()),
    province: v.optional(v.string()),
    region: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_kindbossing_user_id", ["kindbossing_user_id"])
    .index("by_status", ["status"])
    .index("by_location", ["location"]),

  // Job Applications
  job_applications: defineTable({
    kindtao_user_id: v.string(),
    job_post_id: v.string(),
    status: v.string(),
    applied_at: v.number(),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_kindtao_user_id", ["kindtao_user_id"])
    .index("by_job_post_id", ["job_post_id"])
    .index("by_status", ["status"]),

  // Matches
  matches: defineTable({
    kindtao_user_id: v.string(),
    kindbossing_user_id: v.string(),
    job_post_id: v.string(),
    matched_at: v.number(),
    is_opened_by_kindbossing: v.optional(v.boolean()),
    is_opened_by_kindtao: v.optional(v.boolean()),
    created_at: v.number(),
  })
    .index("by_kindtao_user_id", ["kindtao_user_id"])
    .index("by_kindbossing_user_id", ["kindbossing_user_id"])
    .index("by_job_post_id", ["job_post_id"]),

  // Conversations
  conversations: defineTable({
    match_id: v.optional(v.string()),
    last_message_id: v.optional(v.string()),
    last_message_at: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("archived"), v.literal("blocked"))
    ),
    kindbossing_user_id: v.string(),
    kindtao_user_id: v.string(),
    admin_id: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_match_id", ["match_id"])
    .index("by_kindbossing_user_id", ["kindbossing_user_id"])
    .index("by_kindtao_user_id", ["kindtao_user_id"]),

  // Messages
  messages: defineTable({
    conversation_id: v.string(),
    sender_id: v.string(),
    content: v.string(),
    message_type: v.optional(v.string()),
    file_url: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("sent"), v.literal("delivered"), v.literal("read"))
    ),
    read_at: v.optional(v.number()),
    created_at: v.number(),
  })
    .index("by_conversation_id", ["conversation_id"])
    .index("by_sender_id", ["sender_id"]),

  // Employees
  employees: defineTable({
    kindbossing_user_id: v.string(),
    kindtao_user_id: v.string(),
    job_post_id: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_kindbossing_user_id", ["kindbossing_user_id"])
    .index("by_kindtao_user_id", ["kindtao_user_id"])
    .index("by_job_post_id", ["job_post_id"]),

  // Notifications
  notifications: defineTable({
    user_id: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    data: v.optional(v.any()),
    status: v.union(v.literal("unread"), v.literal("read")),
    read_at: v.optional(v.number()),
    created_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_status", ["status"]),

  // Subscriptions
  subscriptions: defineTable({
    user_id: v.string(),
    plan_id: v.optional(v.string()),
    subscription_tier: v.string(),
    current_period_start: v.optional(v.number()),
    current_period_end: v.optional(v.number()),
    cancel_at_period_end: v.optional(v.boolean()),
    cancelled_at: v.optional(v.number()),
    cancellation_reason: v.optional(v.string()),
    daily_swipe_limit: v.optional(v.number()),
    amount_paid: v.optional(v.number()),
    currency: v.optional(v.string()),
    subscription_expires_at: v.optional(v.number()),
    xendit_subscription_id: v.optional(v.string()),
    xendit_customer_id: v.optional(v.string()),
    xendit_plan_id: v.optional(v.string()),
    status: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  }).index("by_user_id", ["user_id"]),

  // Payment Transactions
  payment_transactions: defineTable({
    user_id: v.string(),
    subscription_id: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
    payment_method: v.optional(v.string()),
    xendit_payment_id: v.optional(v.string()),
    xendit_action_id: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  }).index("by_user_id", ["user_id"]),

  // User Settings
  user_settings: defineTable({
    user_id: v.string(),
    settings: v.any(),
    created_at: v.number(),
  }).index("by_user_id", ["user_id"]),

  // KindTao Job Preferences
  kindtao_job_preferences: defineTable({
    kindtao_user_id: v.string(),
    desired_jobs: v.optional(v.array(v.string())),
    desired_locations: v.optional(v.array(v.string())),
    desired_job_types: v.optional(v.array(v.string())),
    salary_range_min: v.optional(v.number()),
    salary_range_max: v.optional(v.number()),
    salary_type: v.optional(v.string()),
    desired_languages: v.optional(v.array(v.string())),
    desired_job_location_radius: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  }).index("by_kindtao_user_id", ["kindtao_user_id"]),

  // KindTao Work Experiences
  kindtao_work_experiences: defineTable({
    kindtao_user_id: v.string(),
    employer: v.optional(v.string()),
    job_title: v.optional(v.string()),
    is_current_job: v.optional(v.boolean()),
    start_date: v.number(),
    end_date: v.optional(v.number()),
    location: v.optional(v.string()),
    skills_used: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_kindtao_user_id", ["kindtao_user_id"]),

  // KindTao Work Experience Attachments
  kindtao_work_experience_attachments: defineTable({
    kindtao_work_experience_id: v.string(),
    file_url: v.string(),
    title: v.string(),
    size: v.number(),
    content_type: v.string(),
    created_at: v.number(),
  }).index("by_kindtao_work_experience_id", ["kindtao_work_experience_id"]),

  // KindTao Portfolio
  kindtao_portfolio: defineTable({
    kindtao_user_id: v.string(),
    file_url: v.string(),
    title: v.string(),
    size: v.number(),
    content_type: v.string(),
    created_at: v.number(),
  }).index("by_kindtao_user_id", ["kindtao_user_id"]),

  // KindBossing Documents
  kindbossing_documents: defineTable({
    kindbossing_user_id: v.string(),
    file_url: v.string(),
    title: v.string(),
    size: v.number(),
    content_type: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_kindbossing_user_id", ["kindbossing_user_id"]),

  // Verification Documents
  verification_documents: defineTable({
    user_id: v.string(),
    file_url: v.string(),
    size: v.number(),
    title: v.string(),
    content_type: v.string(),
    document_type: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_user_id", ["user_id"]),

  // Verification Requests
  verification_requests: defineTable({
    user_id: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_status", ["status"]),

  // Reports
  reports: defineTable({
    reporter_id: v.string(),
    reported_user_id: v.string(),
    report_type: v.string(),
    description: v.optional(v.string()),
    evidence_urls: v.optional(v.array(v.string())),
    handled_by: v.optional(v.string()),
    handled_at: v.optional(v.number()),
    resolution_notes: v.optional(v.string()),
    dismissed_reason: v.optional(v.string()),
    response_sent_at: v.optional(v.number()),
    closed_at: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    code_number: v.optional(v.number()),
    code: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_reporter_id", ["reporter_id"])
    .index("by_reported_user_id", ["reported_user_id"])
    .index("by_status", ["status"]),

  // Admin Actions
  admin_actions: defineTable({
    admin_id: v.string(),
    target_user_id: v.string(),
    action_type: v.string(),
    description: v.optional(v.string()),
    details: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_admin_id", ["admin_id"])
    .index("by_target_user_id", ["target_user_id"]),

  // KindTao Job Interactions
  kindtao_job_interactions: defineTable({
    kindtao_user_id: v.string(),
    job_post_id: v.string(),
    action: v.string(),
    is_rewound: v.optional(v.boolean()),
    rewound_at: v.optional(v.number()),
    created_at: v.number(),
  })
    .index("by_kindtao_user_id", ["kindtao_user_id"])
    .index("by_job_post_id", ["job_post_id"]),

  // Skills
  skills: defineTable({
    skill_name: v.string(),
    type: v.string(),
    created_at: v.number(),
  }).index("by_type", ["type"]),

  pending_user_roles: defineTable({
    email: v.string(),
    role: v.union(
      v.literal("kindbossing"),
      v.literal("kindtao"),
      v.literal("admin")
    ),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_email", ["email"]),
});

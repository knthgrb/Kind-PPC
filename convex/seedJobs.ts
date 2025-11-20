import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed job posts for testing
 * Creates 5 jobs: 2 matching user preferences, 3 non-matching
 */
export const seedJobPosts = mutation({
  args: {
    kindbossing_user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const kindbossingUserId = args.kindbossing_user_id;

    // Central Visayas coordinates (Cebu City area)
    const centralVisayasCoords = {
      lat: 10.3157,
      lng: 123.8854,
    };

    // Jobs that MATCH user preferences
    const matchingJobs = [
      {
        kindbossing_user_id: kindbossingUserId,
        job_title: "Plumber (tubero)",
        job_description: "Looking for an experienced plumber for full-time work in Cebu. Must be able to handle residential and commercial plumbing tasks.",
        required_skills: ["Plumbing", "Pipe installation", "Repair"],
        salary: "800-1200 PHP",
        salary_min: 800,
        salary_max: 1200,
        salary_type: "daily",
        work_schedule: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          hours: "8:00 AM - 5:00 PM",
        },
        required_years_of_experience: 2,
        location: "Cebu City, Central Visayas",
        location_coordinates: centralVisayasCoords,
        preferred_languages: ["English", "Filipino/Tagalog", "Cebuano"],
        status: "active",
        job_type: "full-time",
        province: "Cebu",
        region: "Central Visayas (Region VII)",
        created_at: now,
      },
      {
        kindbossing_user_id: kindbossingUserId,
        job_title: "Nanny/yaya",
        job_description: "Full-time nanny position for a family in Mandaue City. Must be experienced in childcare and household management.",
        required_skills: ["Childcare", "Cooking", "Housekeeping"],
        salary: "600-900 PHP",
        salary_min: 600,
        salary_max: 900,
        salary_type: "daily",
        work_schedule: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          hours: "7:00 AM - 6:00 PM",
        },
        required_years_of_experience: 1,
        location: "Mandaue City, Central Visayas",
        location_coordinates: {
          lat: 10.3236,
          lng: 123.9223,
        },
        preferred_languages: ["English", "Filipino/Tagalog", "Cebuano"],
        status: "active",
        job_type: "full-time",
        province: "Cebu",
        region: "Central Visayas (Region VII)",
        created_at: now + 1000,
      },
    ];

    // Jobs that DON'T MATCH user preferences
    const nonMatchingJobs = [
      {
        kindbossing_user_id: kindbossingUserId,
        job_title: "Driver",
        job_description: "Looking for a professional driver with valid license. Part-time position available.",
        required_skills: ["Driving", "Vehicle maintenance"],
        salary: "700-1000 PHP",
        salary_min: 700,
        salary_max: 1000,
        salary_type: "daily",
        work_schedule: {
          days: ["Monday", "Wednesday", "Friday"],
          hours: "9:00 AM - 3:00 PM",
        },
        required_years_of_experience: 3,
        location: "Manila, Metro Manila",
        location_coordinates: {
          lat: 14.5995,
          lng: 120.9842,
        },
        preferred_languages: ["English", "Filipino/Tagalog"],
        status: "active",
        job_type: "part-time", // Different job type
        province: "Metro Manila",
        region: "National Capital Region (NCR)",
        created_at: now + 2000,
      },
      {
        kindbossing_user_id: kindbossingUserId,
        job_title: "Cook",
        job_description: "Experienced cook needed for restaurant in Davao. Must specialize in Filipino cuisine.",
        required_skills: ["Cooking", "Food preparation", "Kitchen management"],
        salary: "500-800 PHP",
        salary_min: 500,
        salary_max: 800,
        salary_type: "daily",
        work_schedule: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          hours: "10:00 AM - 8:00 PM",
        },
        required_years_of_experience: 2,
        location: "Davao City, Davao del Sur",
        location_coordinates: {
          lat: 7.1907,
          lng: 125.4553,
        },
        preferred_languages: ["English", "Filipino/Tagalog"], // Missing Cebuano
        status: "active",
        job_type: "full-time",
        province: "Davao del Sur",
        region: "Davao Region (Region XI)", // Different region
        created_at: now + 3000,
      },
      {
        kindbossing_user_id: kindbossingUserId,
        job_title: "Security Guard",
        job_description: "Security guard position for commercial building. Must have security license.",
        required_skills: ["Security", "Surveillance", "First aid"],
        salary: "550-750 PHP",
        salary_min: 550,
        salary_max: 750,
        salary_type: "daily",
        work_schedule: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          hours: "6:00 AM - 2:00 PM",
        },
        required_years_of_experience: 1,
        location: "Bacolod City, Negros Occidental",
        location_coordinates: {
          lat: 10.6407,
          lng: 122.9689,
        },
        preferred_languages: ["English", "Filipino/Tagalog", "Hiligaynon"], // Different language
        status: "active",
        job_type: "full-time",
        province: "Negros Occidental",
        region: "Western Visayas (Region VI)", // Different region
        created_at: now + 4000,
      },
    ];

    // Insert all jobs
    const jobIds = [];
    
    for (const job of matchingJobs) {
      const id = await ctx.db.insert("job_posts", job);
      jobIds.push({ id, title: job.job_title, match: true });
    }

    for (const job of nonMatchingJobs) {
      const id = await ctx.db.insert("job_posts", job);
      jobIds.push({ id, title: job.job_title, match: false });
    }

    return {
      success: true,
      message: `Created ${jobIds.length} job posts`,
      jobs: jobIds,
    };
  },
});


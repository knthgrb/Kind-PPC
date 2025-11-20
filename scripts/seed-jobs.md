# Seed Job Posts Command

This command will populate the `job_posts` table with 5 jobs:

- 2 jobs that **match** user preferences
- 3 jobs that **don't match** user preferences

## Prerequisites

You need a `kindbossing_user_id` to create the jobs. You can:

1. Use an existing kindbossing user ID from your database
2. Or create a test kindbossing user first

## Usage

### Option 1: Using Convex Dashboard

1. Go to your Convex Dashboard
2. Navigate to Functions
3. Find `seedJobs:seedJobPosts`
4. Click "Run" and provide:
   ```json
   {
     "kindbossing_user_id": "YOUR_KINDBOSSING_USER_ID_HERE"
   }
   ```

### Option 2: Using Convex CLI

```bash
npx convex run seedJobs:seedJobPosts --args '{"kindbossing_user_id": "YOUR_KINDBOSSING_USER_ID_HERE"}'
```

### Option 3: Using a Script

Create a file `scripts/seed-jobs.ts`:

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function seedJobs() {
  const kindbossingUserId = "YOUR_KINDBOSSING_USER_ID_HERE";

  const result = await client.mutation(api.seedJobs.seedJobPosts, {
    kindbossing_user_id: kindbossingUserId,
  });

  console.log("Seed result:", result);
}

seedJobs();
```

Then run:

```bash
npx tsx scripts/seed-jobs.ts
```

## Job Details

### Matching Jobs (2):

1. **Plumber (tubero)** - Cebu City, full-time, matches all preferences
2. **Nanny/yaya** - Mandaue City, full-time, matches all preferences

### Non-Matching Jobs (3):

1. **Driver** - Manila, part-time (different job type and location)
2. **Cook** - Davao, different region and missing Cebuano language
3. **Security Guard** - Bacolod, different region and language

## Notes

- All jobs are set to `status: "active"`
- All jobs use `salary_type: "daily"`
- Matching jobs are in Central Visayas region
- Non-matching jobs have different locations, job types, or languages

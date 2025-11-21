import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "reset-free-swipes",
  {
    hourUTC: 0,
    minuteUTC: 5,
  },
  internal.credits.resetDailyFreeSwipes
);

crons.monthly(
  "grant-monthly-boost-credit",
  {
    day: 1,
    hourUTC: 0,
    minuteUTC: 10,
  },
  internal.credits.grantMonthlyBoostCredit
);

crons.hourly(
  "close-expired-jobs",
  {
    minuteUTC: 0, // Run at the top of every hour
  },
  internal.jobs.closeExpiredJobs
);

export default crons;

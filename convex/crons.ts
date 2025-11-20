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

export default crons;

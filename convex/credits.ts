import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type UserDoc = Doc<"users">;

async function getNonSubscribedUsers(ctx: MutationCtx): Promise<UserDoc[]> {
  const now = Date.now();
  const activeSubscriptions = await ctx.db
    .query("subscriptions")
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();

  const activeUserIds = new Set(
    activeSubscriptions
      .filter((sub) => {
        const tier = (sub.subscription_tier || "").toLowerCase();
        if (tier === "free") return false;
        if (
          typeof sub.current_period_end === "number" &&
          sub.current_period_end < now
        ) {
          return false;
        }
        return true;
      })
      .map((sub) => sub.user_id)
  );

  const allUsers = await ctx.db.query("users").collect();
  return allUsers.filter((user) => !activeUserIds.has(user.id));
}

export const resetDailyFreeSwipes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const eligibleUsers = await getNonSubscribedUsers(ctx);
    let updatedCount = 0;

    for (const user of eligibleUsers) {
      const currentCredits = user.swipe_credits ?? 0;
      if (currentCredits < 1) {
        await ctx.db.patch(user._id, {
          swipe_credits: 1,
          updated_at: Date.now(),
        });
        updatedCount++;
      }
    }

    console.log(
      `[cron] Daily free swipe reset complete for ${updatedCount} users.`
    );
  },
});

export const grantMonthlyBoostCredit = internalMutation({
  args: {},
  handler: async (ctx) => {
    const eligibleUsers = await getNonSubscribedUsers(ctx);
    let updatedCount = 0;

    for (const user of eligibleUsers) {
      const currentBoosts = user.boost_credits ?? 0;
      if (currentBoosts < 1) {
        await ctx.db.patch(user._id, {
          boost_credits: 1,
          updated_at: Date.now(),
        });
        updatedCount++;
      }
    }

    console.log(
      `[cron] Monthly boost credit grant complete for ${updatedCount} users.`
    );
  },
});



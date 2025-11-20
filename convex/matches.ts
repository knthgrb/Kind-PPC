import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const buildPairKey = (
  userA?: string | null | undefined,
  userB?: string | null | undefined
): string | null => {
  const left = userA ? String(userA) : "";
  const right = userB ? String(userB) : "";
  if (!left || !right) {
    return null;
  }
  return [left, right].sort().join("|");
};

const collectConversationsForUser = async (
  ctx: any,
  identifiers: Set<string>
) => {
  const conversations: any[] = [];
  const seenIds = new Set<string>();

  for (const identifier of identifiers) {
    const results = await ctx.db
      .query("conversations")
      .filter((q: any) =>
        q.or(
          q.eq(q.field("kindbossing_user_id"), identifier),
          q.eq(q.field("kindtao_user_id"), identifier)
        )
      )
      .collect();

    for (const conversation of results) {
      const conversationId = String(conversation._id || "");
      if (conversationId && !seenIds.has(conversationId)) {
        seenIds.add(conversationId);
        conversations.push(conversation);
      }
    }
  }

  return conversations;
};

const filterMatchesByConversations = (
  matches: any[],
  conversations: any[],
  role: "kindtao" | "kindbossing"
) => {
  if (!matches || matches.length === 0) {
    return matches;
  }
  if (!conversations || conversations.length === 0) {
    return matches;
  }

  const matchIdsWithConversations = new Set<string>();
  const userPairsWithConversations = new Set<string>();

  for (const conversation of conversations) {
    const matchId = conversation.match_id
      ? String(conversation.match_id)
      : null;
    if (matchId) {
      matchIdsWithConversations.add(matchId);
    }

    const pairKey = buildPairKey(
      conversation.kindbossing_user_id,
      conversation.kindtao_user_id
    );
    if (pairKey) {
      userPairsWithConversations.add(pairKey);
    }
  }

  return matches.filter((match) => {
    const matchId = match?._id ? String(match._id) : "";
    const pairKey = buildPairKey(
      match?.kindbossing_user_id,
      match?.kindtao_user_id
    );

    const hasConversation =
      (matchId && matchIdsWithConversations.has(matchId)) ||
      (pairKey ? userPairsWithConversations.has(pairKey) : false);

    const isUnopened =
      role === "kindtao"
        ? match?.is_opened_by_kindtao !== true
        : match?.is_opened_by_kindbossing !== true;

    return isUnopened || !hasConversation;
  });
};

// Get matches by kindtao user
export const getMatchesByKindTao = query({
  args: {
    userId: v.string(),
    filterOpenedWithConversation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // First, try to get the user record to check both id and _id formats
    const userByFieldId = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    // Try to find matches by the provided userId (could be id field)
    // kindtao_user_id is stored as Better Auth user ID (id field), not Convex _id
    let matches = await ctx.db
      .query("matches")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.userId))
      .collect();

    // If no matches found, try querying without index as fallback
    // This handles cases where the index might not be working or userId format differs
    if (matches.length === 0) {
      const allMatches = await ctx.db.query("matches").collect();
      matches = allMatches.filter((match) => {
        const matchKindtaoUserId = String(match.kindtao_user_id || "");
        return matchKindtaoUserId === args.userId;
      });
    }

    // If still no matches found and we have a user record, try using the user's _id
    // (though kindtao_user_id should be the Better Auth ID, not Convex _id)
    if (matches.length === 0 && userByFieldId) {
      const userConvexId = String(userByFieldId._id || "");
      if (userConvexId) {
        const matchesByConvexId = await ctx.db
          .query("matches")
          .withIndex("by_kindtao_user_id")
          .filter((q) => q.eq(q.field("kindtao_user_id"), userConvexId))
          .collect();
        if (matchesByConvexId.length > 0) {
          matches = matchesByConvexId;
        }
      }
    }

    // Debug: Log what we found (using console for Convex queries)
    if (matches.length === 0) {
      // Get a sample of all matches to see what kindtao_user_id values exist
      const sampleMatches = await ctx.db.query("matches").take(10);
      const sampleData = sampleMatches.map((m) => ({
        _id: String(m._id || ""),
        kindtao_user_id: String(m.kindtao_user_id || ""),
        kindbossing_user_id: String(m.kindbossing_user_id || ""),
      }));
      // Log to help debug - this will appear in Convex dashboard logs
      console.log("[getMatchesByKindTao] Debug info:", {
        requestedUserId: args.userId,
        userByFieldId: userByFieldId
          ? { id: userByFieldId.id, _id: String(userByFieldId._id) }
          : null,
        sampleMatches: sampleData,
        totalMatchesInDb: (await ctx.db.query("matches").collect()).length,
      });
    } else {
      console.log("[getMatchesByKindTao] Found matches:", {
        requestedUserId: args.userId,
        matchCount: matches.length,
        matchIds: matches.map((m) => String(m._id || "")),
      });
    }

    // Get job and kindbossing details
    const matchesWithDetails = await Promise.all(
      matches.map(async (match) => {
        // job_post_id is stored as a Convex _id, so use get() to fetch it
        let job = null;
        if (match.job_post_id) {
          try {
            const jobId = match.job_post_id as any;
            job = await ctx.db.get(jobId);
          } catch (error) {
            // Job not found - job will remain null
            job = null;
          }
        }

        // kindbossing_user_id is stored as a Convex _id, so use get() to fetch it
        let kindbossing = null;
        try {
          const kindbossingId = match.kindbossing_user_id as any;
          kindbossing = await ctx.db.get(kindbossingId);
        } catch (error) {
          // If get fails, try querying by id field as fallback
          try {
            kindbossing = await ctx.db
              .query("users")
              .filter((q) => q.eq(q.field("id"), match.kindbossing_user_id))
              .first();
          } catch (e) {
            // If that also fails, kindbossing will remain null
          }
        }
        return { ...match, job, kindbossing, kindbossing_user: kindbossing };
      })
    );

    if (args.filterOpenedWithConversation === true) {
      const identifiers = new Set<string>([args.userId]);
      if (userByFieldId?._id) {
        identifiers.add(String(userByFieldId._id));
      }
      const conversations = await collectConversationsForUser(
        ctx,
        identifiers
      );
      return filterMatchesByConversations(
        matchesWithDetails,
        conversations,
        "kindtao"
      );
    }

    return matchesWithDetails;
  },
});

// Get matches by kindbossing user
export const getMatchesByKindBossing = query({
  args: {
    userId: v.string(),
    filterOpenedWithConversation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // First, try to get the user record to check both id and _id formats
    const userByFieldId = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    // Try to find matches by the provided userId (could be id field)
    let matches = await ctx.db
      .query("matches")
      .withIndex("by_kindbossing_user_id")
      .filter((q) => q.eq(q.field("kindbossing_user_id"), args.userId))
      .collect();

    // If no matches found and we have a user record, try using the user's _id
    if (matches.length === 0 && userByFieldId) {
      const userDocId = userByFieldId._id;
      matches = await ctx.db
        .query("matches")
        .withIndex("by_kindbossing_user_id")
        .filter((q) => q.eq(q.field("kindbossing_user_id"), String(userDocId)))
        .collect();
    }

    // Get job and kindtao details
    const matchesWithDetails = await Promise.all(
      matches.map(async (match) => {
        // job_post_id is stored as a Convex _id, so use get() to fetch it
        let job = null;
        if (match.job_post_id) {
          try {
            const jobId = match.job_post_id as any;
            job = await ctx.db.get(jobId);
          } catch (error) {
            // Job not found - job will remain null
            job = null;
          }
        }

        // kindtao_user_id is stored as Better Auth user ID (id field), not Convex _id
        let kindtao = null;
        try {
          // Try using the by_user_id index first (most efficient)
          kindtao = await ctx.db
            .query("users")
            .withIndex("by_user_id")
            .filter((q) => q.eq(q.field("id"), match.kindtao_user_id))
            .first();
        } catch (error) {
          // Fallback: try without index
          try {
            kindtao = await ctx.db
              .query("users")
              .filter((q) => q.eq(q.field("id"), match.kindtao_user_id))
              .first();
          } catch (e) {
            // kindtao will remain null
          }
        }
        return { ...match, job, kindtao, kindtao_user: kindtao };
      })
    );

    if (args.filterOpenedWithConversation === true) {
      const identifiers = new Set<string>([args.userId]);
      if (userByFieldId?._id) {
        identifiers.add(String(userByFieldId._id));
      }
      const conversations = await collectConversationsForUser(
        ctx,
        identifiers
      );
      return filterMatchesByConversations(
        matchesWithDetails,
        conversations,
        "kindbossing"
      );
    }

    return matchesWithDetails;
  },
});

// Create match
export const createMatch = mutation({
  args: {
    kindtao_user_id: v.string(),
    kindbossing_user_id: v.string(),
    job_post_id: v.string(),
  },
  handler: async (ctx, args) => {
    const matchId = await ctx.db.insert("matches", {
      ...args,
      matched_at: Date.now(),
      is_opened_by_kindbossing: false,
      is_opened_by_kindtao: false,
      created_at: Date.now(),
    });
    return matchId;
  },
});

// Get match by ID
export const getMatchById = query({
  args: { matchId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    // Try to get match by _id first
    let match = null;
    try {
      const matchId = args.matchId as Id<"matches">;
      match = await ctx.db.get(matchId);
    } catch (error) {
      // Match not found - match will remain null
      match = null;
    }

    if (!match) return null;

    // Get kindtao user details
    // kindtao_user_id is stored as Better Auth user ID (id field), not Convex _id
    let kindtao = null;
    try {
      // Try using the by_user_id index first (most efficient)
      kindtao = await ctx.db
        .query("users")
        .withIndex("by_user_id")
        .filter((q) => q.eq(q.field("id"), match.kindtao_user_id))
        .first();
    } catch (error) {
      // Fallback: try without index
      try {
        kindtao = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("id"), match.kindtao_user_id))
          .first();
      } catch (e) {
        // kindtao will remain null
      }
    }

    // Get job details
    let job = null;
    if (match.job_post_id) {
      try {
        const jobId = match.job_post_id as any;
        job = await ctx.db.get(jobId);
      } catch (error) {
        // Job not found - job will remain null
        job = null;
      }
    }

    return { ...match, kindtao, kindtao_user: kindtao, job };
  },
});

// Get all matches between two users (to show all matched job titles)
export const getMatchesByUserIds = query({
  args: {
    kindbossingUserId: v.string(),
    kindtaoUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all matches where both user IDs match
    // Check both possible combinations: (kindbossing, kindtao) and (kindtao, kindbossing)
    const matches1 = await ctx.db
      .query("matches")
      .filter((q) =>
        q.and(
          q.eq(q.field("kindbossing_user_id"), args.kindbossingUserId),
          q.eq(q.field("kindtao_user_id"), args.kindtaoUserId)
        )
      )
      .collect();

    const matches2 = await ctx.db
      .query("matches")
      .filter((q) =>
        q.and(
          q.eq(q.field("kindbossing_user_id"), args.kindtaoUserId),
          q.eq(q.field("kindtao_user_id"), args.kindbossingUserId)
        )
      )
      .collect();

    const matches = [...matches1, ...matches2];

    // Get job details for each match
    const matchesWithJobs = await Promise.all(
      matches.map(async (match) => {
        let job = null;
        if (match.job_post_id) {
          try {
            const jobId = match.job_post_id as any;
            job = await ctx.db.get(jobId);
          } catch (error) {
            job = null;
          }
        }
        return { ...match, job };
      })
    );

    return matchesWithJobs;
  },
});

// Update match opened status
export const updateMatchOpened = mutation({
  args: {
    matchId: v.id("matches"),
    openedBy: v.union(v.literal("kindbossing"), v.literal("kindtao")),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.openedBy === "kindbossing") {
      updates.is_opened_by_kindbossing = true;
    } else {
      updates.is_opened_by_kindtao = true;
    }
    await ctx.db.patch(args.matchId, updates);
  },
});

// Delete match
export const deleteMatch = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.matchId);
  },
});

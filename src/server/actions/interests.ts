// This file contains server actions related to user interests and onboarding
"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { tags, userInterests, users } from "~/server/db/schema/tables";
import { getSession } from "~/server/auth";
import {
  INTEREST_WEIGHTS,
  VOTE_WEIGHT_MAP,
  type VoteType,
} from "~/lib/recommendations/constants";
import { revalidatePath } from "next/cache";

/**
 * Save initial interests during onboarding
 */
export async function saveOnboardingInterests(tagIds: string[]) {
  const session = await getSession({});
  if (!session?.userProfileId) {
    throw new Error("Not authenticated");
  }

  await db.transaction(async (tx) => {
    // Insert selected interests with initial weight
    if (tagIds.length > 0) {
      await tx
        .insert(userInterests)
        .values(
          tagIds.map((tagId) => ({
            userProfileId: session.userProfileId,
            tagId,
            weight: INTEREST_WEIGHTS.INITIAL_SELECTION.toString(),
          })),
        )
        .onDuplicateKeyUpdate({
          set: {
            weight: sql`${userInterests.weight} + ${INTEREST_WEIGHTS.INITIAL_SELECTION}`,
          },
        });
    }

    // Mark onboarding complete
    await tx
      .update(users)
      .set({ onboardingCompleted: true })
      .where(eq(users.profileId, session.userProfileId));
  });

  revalidatePath("/");
}

/**
 * Skip onboarding without selecting interests
 */
export async function skipOnboarding() {
  const session = await getSession({});
  if (!session?.userProfileId) {
    throw new Error("Not authenticated");
  }

  await db
    .update(users)
    .set({ onboardingCompleted: true })
    .where(eq(users.profileId, session.userProfileId));

  revalidatePath("/");
}

/**
 * Update interest weights based on voting behavior
 * Call this after a user votes on a post
 */
export async function updateInterestsFromVote(
  postTagIds: string[],
  voteType: VoteType,
  previousVote?: VoteType | null,
) {
  const session = await getSession({});
  if (!session?.userProfileId || postTagIds.length === 0) {
    return;
  }

  const weightDelta = VOTE_WEIGHT_MAP[voteType];
  const previousDelta = previousVote ? VOTE_WEIGHT_MAP[previousVote] : 0;
  const netDelta = weightDelta - previousDelta;

  if (netDelta === 0) return;

  await db.transaction(async (tx) => {
    for (const tagId of postTagIds) {
      await tx
        .insert(userInterests)
        .values({
          userProfileId: session.userProfileId,
          tagId,
          weight: Math.max(INTEREST_WEIGHTS.MIN_WEIGHT, netDelta).toString(),
        })
        .onDuplicateKeyUpdate({
          set: {
            weight: sql`GREATEST(${INTEREST_WEIGHTS.MIN_WEIGHT}, LEAST(${INTEREST_WEIGHTS.MAX_WEIGHT}, ${userInterests.weight} + ${netDelta}))`,
          },
        });
    }
  });
}

/**
 * Get user's current interests with weights
 */
export async function getUserInterests() {
  const session = await getSession({});
  if (!session?.userProfileId) {
    return [];
  }

  return db
    .select({
      tagId: userInterests.tagId,
      tagName: tags.name,
      weight: userInterests.weight,
    })
    .from(userInterests)
    .innerJoin(tags, eq(tags.id, userInterests.tagId))
    .where(eq(userInterests.userProfileId, session.userProfileId))
    .orderBy(sql`${userInterests.weight} DESC`);
}

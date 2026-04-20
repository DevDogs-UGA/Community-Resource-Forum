"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { INTEREST_WEIGHTS } from "~/lib/recommendations/constants";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";
import { postTags, tags, userInterests, users } from "~/server/db/schema/tables";

/**
 * Save initial interests during onboarding
 */
export async function saveOnboardingInterests(tagIds: string[]) {
  const session = await getSession({});
  if (!session?.userProfileId) {
    throw new Error("Not authenticated");
  }

  await db.transaction(async (tx) => {
    if (tagIds.length > 0) {
      await tx
        .insert(userInterests)
        .values(
          tagIds.map((tagId) => ({
            userProfileId: session.userProfileId,
            tagId,
            weight: INTEREST_WEIGHTS.INITIAL_SELECTION.toString(),
          }))
        )
        .onDuplicateKeyUpdate({
          set: {
            weight: sql`${userInterests.weight} + ${INTEREST_WEIGHTS.INITIAL_SELECTION}`,
          },
        });
    }

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
 */
export async function updateInterestsFromVote(
  postId: string,
  isUpvote: boolean,
  previousVoteWasUpvote: boolean | null
) {
  const session = await getSession({});
  if (!session?.userProfileId) {
    return;
  }

  // Get all tags for this post
  const postTagsResult = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, postId));

  if (postTagsResult.length === 0) {
    return;
  }

  // Calculate weight delta
  let weightDelta = 0;

  if (previousVoteWasUpvote === null) {
    weightDelta = isUpvote ? INTEREST_WEIGHTS.UPVOTE : INTEREST_WEIGHTS.DOWNVOTE;
  } else if (previousVoteWasUpvote !== isUpvote) {
    weightDelta = isUpvote
      ? INTEREST_WEIGHTS.UPVOTE - INTEREST_WEIGHTS.DOWNVOTE
      : INTEREST_WEIGHTS.DOWNVOTE - INTEREST_WEIGHTS.UPVOTE;
  } else {
    return;
  }

  // Update weights for all tags on this post
  await db.transaction(async (tx) => {
    for (const { tagId } of postTagsResult) {
      await tx
        .insert(userInterests)
        .values({
          userProfileId: session.userProfileId,
          tagId,
          weight: Math.max(INTEREST_WEIGHTS.MIN_WEIGHT, weightDelta).toString(),
        })
        .onDuplicateKeyUpdate({
          set: {
            weight: sql`GREATEST(${INTEREST_WEIGHTS.MIN_WEIGHT}, LEAST(${INTEREST_WEIGHTS.MAX_WEIGHT}, ${userInterests.weight} + ${weightDelta}))`,
          },
        });
    }

    // Clean up: delete any interests with weight 0
    await tx
      .delete(userInterests)
      .where(
        and(
          eq(userInterests.userProfileId, session.userProfileId),
          eq(userInterests.weight, "0.00")
        )
      );
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

/**
 * Add a single interest
 */
export async function addInterest(tagId: string) {
  const session = await getSession({});
  if (!session?.userProfileId) {
    throw new Error("Not authenticated");
  }

  await db
    .insert(userInterests)
    .values({
      userProfileId: session.userProfileId,
      tagId,
      weight: "1.00",
    })
    .onDuplicateKeyUpdate({
      set: {
        weight: sql`${userInterests.weight} + 1`,
      },
    });

  revalidatePath(`/profile/${session.userProfileId}/edit`);
}

/**
 * Remove a single interest
 */
export async function removeInterest(tagId: string) {
  const session = await getSession({});
  if (!session?.userProfileId) {
    throw new Error("Not authenticated");
  }

  await db
    .delete(userInterests)
    .where(
      and(
        eq(userInterests.userProfileId, session.userProfileId),
        eq(userInterests.tagId, tagId)
      )
    );

  revalidatePath(`/profile/${session.userProfileId}/edit`);
}
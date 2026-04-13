import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  posts,
  postTags,
  userInterests,
  profiles,
  events,
  postVotes,
  tags,
} from "~/server/db/schema/tables";

interface PostRelation {
  post: typeof posts.$inferSelect;
  author: typeof profiles.$inferSelect;
  event: typeof events.$inferSelect | null;
  vote: typeof postVotes.$inferSelect | null;
  tags: Map<string, typeof tags.$inferSelect>;
  relevanceScore: number;
}

export async function getRecommendedPosts(
  userProfileId: string | null,
  limit = 20,
  offset = 0,
): Promise<PostRelation[]> {
  const result = await db
    .select({
      post: posts,
      author: profiles,
      event: events,
      vote: postVotes,
      tag: tags,
      relevanceScore: sql<string>`COALESCE(SUM(${userInterests.weight}), 0)`,
    })
    .from(posts)
    .where(eq(posts.quarantined, false))
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(postTags, eq(postTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postTags.tagId))
    .leftJoin(events, eq(events.id, posts.eventId))
    .leftJoin(
      postVotes,
      and(
        eq(postVotes.userProfileId, userProfileId ?? ""),
        eq(postVotes.postId, posts.id),
      ),
    )
    .leftJoin(
      userInterests,
      and(
        eq(userInterests.tagId, postTags.tagId),
        eq(userInterests.userProfileId, userProfileId ?? ""),
      ),
    )
    .groupBy(
      posts.id,
      profiles.id,
      events.id,
      postVotes.postId,
      postVotes.userProfileId,
      tags.id,
    )
    .orderBy(
      desc(sql`COALESCE(SUM(${userInterests.weight}), 0)`),
      desc(posts.createdAt),
    )
    .offset(offset)
    .limit(limit);

  // Aggregate tags per post
  const postsMap = new Map<string, PostRelation>();

  for (const row of result) {
    if (!postsMap.has(row.post.id)) {
      postsMap.set(row.post.id, {
        post: row.post,
        author: row.author,
        event: row.event,
        vote: row.vote,
        tags: new Map(),
        relevanceScore: parseFloat(row.relevanceScore) || 0,
      });
    }
    if (row.tag) {
      postsMap.get(row.post.id)!.tags.set(row.tag.id, row.tag);
    }
  }

  return Array.from(postsMap.values());
}

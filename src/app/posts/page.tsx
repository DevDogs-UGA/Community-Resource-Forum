import { and, between, desc, eq, or, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { PiXBold } from "react-icons/pi";
import Post from "~/components/Post";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";
import {
  events,
  posts,
  postVotes,
  profiles,
  tags,
  postTags,
  userInterests,
} from "~/server/db/schema/tables";

interface PostRelation {
  post: typeof posts.$inferSelect;
  author: typeof profiles.$inferSelect;
  event: typeof events.$inferSelect | null;
  vote: typeof postVotes.$inferSelect | null;
  tags: Map<string, typeof tags.$inferSelect>;
  relevanceScore: number;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tagParam = await searchParams.then((s) => {
    if ("t" in s && s.t !== undefined) {
      return s.t instanceof Array ? s.t : [s.t];
    }
    return [];
  });

  const tagsResult =
    tagParam.length > 0
      ? await db
          .select()
          .from(tags)
          .where(or(...tagParam.map((tag) => eq(tags.id, tag))))
      : [];

  const queriedTags = alias(tags, "queriedTags");
  const queriedTagRelations = alias(postTags, "queriedTagRelations");

  // Query with recommendation scoring
  const postsResult = await db
    .select({
      post: posts,
      author: profiles,
      event: events,
      vote: postVotes,
      tag: tags,
      // Calculate relevance score from user interests
      relevanceScore: sql<string>`COALESCE(SUM(${userInterests.weight}), 0)`,
    })
    .from(posts)
    .where(eq(posts.quarantined, false))
    .leftJoin(queriedTagRelations, eq(queriedTagRelations.postId, posts.id))
    .leftJoin(queriedTags, eq(queriedTags.id, queriedTagRelations.tagId))
    .groupBy(
      posts.id,
      profiles.id,
      events.id,
      postVotes.postId,
      postVotes.userProfileId,
      tags.id,
    )
    .having(
      tagsResult.length > 0
        ? and(
            ...tagsResult.map((tag) =>
              sum(between(queriedTags.lft, tag.lft, tag.rgt)),
            ),
          )
        : undefined,
    )
    // Order by relevance score (personalized), then by date
    .orderBy(
      desc(sql`COALESCE(SUM(${userInterests.weight}), 0)`),
      desc(posts.createdAt),
    )
    .offset(0)
    .limit(20)
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(postTags, eq(postTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postTags.tagId))
    .leftJoin(events, eq(events.id, posts.eventId))
    .leftJoin(
      postVotes,
      and(
        eq(postVotes.userProfileId, session?.userProfileId ?? ""),
        eq(postVotes.postId, posts.id),
      ),
    )
    // Join user interests for relevance scoring
    .leftJoin(
      userInterests,
      and(
        eq(userInterests.tagId, postTags.tagId),
        eq(userInterests.userProfileId, session?.userProfileId ?? ""),
      ),
    )
    .then((queryResponse) =>
      queryResponse.reduce(
        (results, { post, author, event, vote, tag, relevanceScore }) => {
          if (!results.has(post.id)) {
            results.set(post.id, {
              post,
              author,
              event,
              vote,
              tags: new Map(),
              relevanceScore: parseFloat(relevanceScore) || 0,
            });
          }

          if (tag) {
            results.get(post.id)!.tags.set(tag.id, tag);
          }

          return results;
        },
        new Map<string, PostRelation>(),
      ),
    );

  const { posts, tags } = await db.transaction(async (tx) => {
    const session = await getSession(
      {
        user: {
          columns: {},
          with: {
            organizationPermissions: {
              columns: {
                organizationProfileId: true,
                rank: true,
              },
            },
          },
        },
      },
      tx,
    );

    const tags =
      tagParam.length > 0
        ? await tx.query.tags.findMany({
            where: { OR: tagParam.map((tag) => ({ id: tag })) },
          })
        : [];

    const posts = await tx.query.posts.findMany({
      limit: 20,
      where: {
        AND: [
          {
            quarantined: false,
            OR: [
              {
                accessRank: { isNull: true },
              },
              ...(session?.user.organizationPermissions.map((org) => ({
                authorId: org.organizationProfileId,
                accessRank: { gte: org.rank },
              })) ?? []),
            ],
          },
          ...tags.map((tag) => ({
            tags: {
              lft: { gte: tag.lft, lte: tag.rgt },
            },
          })),
        ],
      },
      with: {
        author: true,
        event: true,
        votes: {
          limit: 1,
          where: {
            userProfileId: session?.userProfileId,
          },
        },
        tags: true,
        attachments: true,
      },
    });

    return { posts, tags };
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-8">
      {tags.length > 0 && (
        <h1 className="flex flex-wrap items-center gap-1.5">
          Showing{" "}
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="flex overflow-hidden rounded-sm border border-sky-800 shadow-xs"
            >
              <span className="line-clamp-1 flex-1 bg-sky-50 pr-6 pl-1.5 text-nowrap overflow-ellipsis">
                {tag.name}
              </span>
              <PiXBold />
            </span>
          ))}
        </h1>
      )}

      {posts.map(({ author, event, votes, tags, attachments, ...post }) => (
        <div
          className="overflow-hidden rounded-md border border-gray-300"
          key={post.id}
        >
          <Post
            post={post}
            author={author}
            event={event}
            vote={votes[0]}
            attachments={attachments}
            tags={tags}
            tagParam={tagParam}
          />
        </div>
      ))}
      {posts.length === 0 && (
        <p className="max-w-prose text-center text-sm text-gray-600">
          There aren&rsquo;t any posts to display yet. Try signing in and
          publishing some!
        </p>
      )}
    </div>
  );
}

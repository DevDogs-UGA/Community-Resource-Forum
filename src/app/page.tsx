import { formatDistanceToNowStrict, getDate } from "date-fns";
import { and, between, desc, eq, or, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import Link from "next/link";
import {
  PiCalendarBlank,
  PiChatCircleTextBold,
  PiDotsThreeBold,
  PiHash,
  PiShareFatBold,
  PiXBold,
} from "react-icons/pi";
import Avatar from "~/components/Avatar";
import LikeButton from "~/components/LikeButton";
import formatEventTime from "~/lib/formatEventTime";
import { getSessionUser } from "~/server/auth";
import { db } from "~/server/db";
import {
  events,
  likes,
  posts,
  profiles,
  tags,
  tagsToPosts,
} from "~/server/db/schema";

interface PostRelation {
  post: typeof posts.$inferSelect;
  author: typeof profiles.$inferSelect;
  event: typeof events.$inferSelect | null;
  tags: Map<string, typeof tags.$inferSelect>;
  liked: boolean;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSessionUser();
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
  const queriedTagRelations = alias(tagsToPosts, "queriedTagRelations");

  const postsResult = await db
    .select({
      post: posts,
      author: profiles,
      event: events,
      like: likes,
      tag: tags,
    })
    .from(posts)
    .innerJoin(queriedTagRelations, eq(queriedTagRelations.postId, posts.id))
    .innerJoin(queriedTags, eq(queriedTags.id, queriedTagRelations.tagId))
    .groupBy(posts.id, tags.id)
    .having(and(
        ...tagsResult.map((tag) => sum(between(queriedTags.lft, tag.lft, tag.rgt))),
      ))
    .orderBy(desc(posts.createdAt))
    .offset(0)
    .limit(20)
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(tagsToPosts, eq(tagsToPosts.postId, posts.id))
    .leftJoin(tags, eq(tagsToPosts.tagId, tags.id))
    .leftJoin(events, eq(posts.eventId, events.id))
    .leftJoin(
      likes,
      and(eq(likes.userId, session?.userId ?? ""), eq(likes.postId, posts.id)),
    )
    .then((queryResponse) =>
      queryResponse.reduce((results, { post, author, event, like, tag }) => {
        if (!results.has(post.id)) {
          results.set(post.id, {
            post,
            author,
            event,
            liked: !!like,
            tags: new Map(),
          });
        }

        if (tag) {
          results.get(post.id)!.tags.set(tag.id, tag);
        }

        return results;
      }, new Map<string, PostRelation>()),
    );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
      {tagsResult.length > 0 && (
        <h1 className="flex flex-wrap items-center gap-1.5">
          Showing{" "}
          {tagsResult.map((tag) => (
            <span
              key={tag.id}
              className="flex overflow-hidden rounded-sm border border-sky-800 shadow-xs"
            >
              <span className="line-clamp-1 flex-1 bg-sky-50 pr-6 pl-1.5 text-nowrap overflow-ellipsis">
                {tag.name}
              </span>
              <Link
                className="flex items-center bg-sky-800 px-1.5 py-0.5 text-white transition-colors hover:bg-sky-700"
                href={
                  tagParam.length > 1
                    ? {
                        query: {
                          t: tagParam.filter((param) => param !== tag.id),
                        },
                      }
                    : "/"
                }
              >
                <PiXBold />
              </Link>
            </span>
          ))}
        </h1>
      )}
      {postsResult
        .values()
        .map(({ post, author, event, liked, tags }) => (
          <article
            key={post.id}
            className="rounded-md border border-gray-300 bg-white px-2"
          >
            <div className="flex flex-col gap-2 px-2 py-4">
              <div className="flex items-start gap-3">
                <Link
                  href={`/users/${author.id}`}
                  className="group flex flex-1 items-center gap-3 text-3xl"
                >
                  <Avatar {...author} />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm leading-none font-bold group-hover:underline">
                      {author.name}
                    </span>
                    <span className="text-xs leading-none text-gray-600 capitalize">
                      {author.type}
                    </span>
                  </span>
                </Link>

                <button className="-m-0.5 rounded-full p-0.5 hover:bg-gray-200">
                  <PiDotsThreeBold />
                </button>
              </div>

              {post.content && (
                <div
                  className="prose prose-sm"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              )}

              {event && (
                <Link
                  className="mt-3 flex flex-1 items-center gap-3 rounded-sm border border-gray-300 bg-gray-50 px-2 py-1.5 text-xl text-black shadow-xs"
                  href={`/events/${post.eventId}`}
                >
                  <span className="relative">
                    <PiCalendarBlank />
                    <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-px text-center text-[0.55rem] font-bold">
                      {getDate(event.start)}
                    </span>
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="-mt-0.5 overflow-x-hidden text-sm/[1.25] overflow-ellipsis">
                      {event.title}
                    </span>
                    <span className="text-[0.6rem]/[1] font-bold text-gray-600">
                      {formatEventTime(event)}
                    </span>
                  </span>

                  <button className="rounded-xs px-2 py-0.5 text-xs font-bold text-sky-800 uppercase ring-sky-800/50 hover:bg-sky-100 hover:ring">
                    RSVP
                  </button>
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-start gap-y-1 pb-2 text-xs">
              {tags
                .values()
                .map((tag) => (
                  <Link
                    key={tag.id}
                    className="line-clamp-1 flex items-center justify-center gap-0.5 px-2 py-0.5 text-nowrap overflow-ellipsis text-sky-900/70 hover:bg-sky-50 hover:text-sky-900 hover:shadow-xs"
                    href={{
                      query: {
                        t: tagParam.includes(tag.id)
                          ? tagParam
                          : [tag.id, ...tagParam],
                      },
                    }}
                  >
                    <PiHash />
                    {tag.name}
                  </Link>
                ))
                .toArray()}
              <p className="ml-auto block px-2 text-nowrap text-gray-500">
                Posted {formatDistanceToNowStrict(post.createdAt)} ago
              </p>
            </div>

            <div className="flex justify-between gap-2 border-t border-t-gray-300 px-2 py-3 text-gray-700">
              <LikeButton
                postId={post.id}
                likeCount={post.likeCount}
                likeStatus={liked}
              />
              <button className="flex items-center gap-2 rounded-sm px-2 py-1 leading-none hover:bg-green-100">
                <PiChatCircleTextBold />
                {/* <span className="text-xs font-semibold">33</span> */}
              </button>
              <button className="flex items-center gap-2 rounded-sm px-2 py-1 leading-none hover:bg-sky-100">
                <PiShareFatBold />
                {/* <span className="text-xs font-semibold">12</span> */}
              </button>
            </div>
          </article>
        ))
        .toArray()}
    </div>
  );
}

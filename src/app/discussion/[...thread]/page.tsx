import { formatDistanceToNowStrict, getDate } from "date-fns";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PiCalendarBlank,
  PiChatCircleTextBold,
  PiDotsThreeBold,
  PiHash,
  PiShareFatBold,
} from "react-icons/pi";
import Avatar from "~/components/Avatar";
import CommentEditor from "~/components/CommentEditor";
import VoteButton from "~/components/VoteButton";
import formatEventTime from "~/lib/formatEventTime";
import { getSessionUser } from "~/server/auth";
import { db } from "~/server/db";
import { comments, commentVotes, posts, postVotes } from "~/server/db/schema";

export default async function Page({
  params,
}: PageProps<"/discussion/[...thread]">) {
  const session = await getSessionUser();
  const [postId, commentId, ...rest] = (await params).thread;

  if (!postId || rest.length > 0) {
    notFound();
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      author: true,
      event: true,
      tags: {
        with: {
          tag: true,
        },
      },
      votes: session
        ? {
            where: eq(postVotes.userId, session.userId),
            limit: 1,
          }
        : undefined,
      comments: commentId
        ? {
            where: eq(comments.id, commentId),
            limit: 1,
            with: {
              author: true,
              votes: session
                ? {
                    where: eq(commentVotes.userId, session.userId),
                    limit: 1,
                  }
                : undefined,
              replies: {
                orderBy: sql`${comments.score} + ${comments.replyCount}`,
                limit: 5,
                with: {
                  author: true,
                  votes: session
                    ? {
                        where: eq(commentVotes.userId, session.userId),
                        limit: 1,
                      }
                    : undefined,
                  replies: {
                    orderBy: sql`${comments.score} + ${comments.replyCount}`,
                    limit: 2,
                    with: {
                      author: true,
                      votes: session
                        ? {
                            where: eq(commentVotes.userId, session.userId),
                            limit: 1,
                          }
                        : undefined,
                    },
                  },
                },
              },
            },
          }
        : {
            orderBy: sql`${comments.score} + ${comments.replyCount}`,
            limit: 10,
            with: {
              author: true,
              votes: session
                ? {
                    where: eq(commentVotes.userId, session.userId),
                    limit: 1,
                  }
                : undefined,
              replies: {
                orderBy: sql`${comments.score} + ${comments.replyCount}`,
                limit: 2,
                with: {
                  author: true,
                  votes: session
                    ? {
                        where: eq(commentVotes.userId, session.userId),
                        limit: 1,
                      }
                    : undefined,
                },
              },
            },
          },
    },
  });

  if (!post || (commentId && post.comments.length === 0)) {
    notFound();
  }

  console.log(post);

  return (
    <div className="px-3">
      <section className="mx-auto flex w-full max-w-xl flex-col gap-3 py-6">
        <article
          className="rounded-md border border-gray-300 bg-white px-2"
          key={post.id}
        >
          <div className="flex flex-col gap-2 px-2 py-4">
            <div className="flex items-start gap-3">
              <Link
                href={`/profile/${post.author.id}`}
                className="group flex flex-1 items-center gap-3 text-3xl"
              >
                <Avatar {...post.author} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm leading-none font-bold group-hover:underline">
                    {post.author.name}
                  </span>
                  <span className="text-xs leading-none text-gray-600 capitalize">
                    {post.author.type}
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

            {post.event && (
              <Link
                className="mt-3 flex flex-1 items-center gap-3 rounded-sm border border-gray-300 bg-gray-50 px-2 py-1.5 text-xl text-black shadow-xs"
                href={`/event/${post.eventId}`}
              >
                <span className="relative">
                  <PiCalendarBlank />
                  <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-px text-center text-[0.55rem] font-bold">
                    {getDate(post.event.start)}
                  </span>
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="-mt-0.5 overflow-x-hidden text-sm/[1.25] overflow-ellipsis">
                    {post.event.title}
                  </span>
                  <span className="text-[0.6rem]/[1] font-bold text-gray-600">
                    {formatEventTime(post.event)}
                  </span>
                </span>

                <button className="rounded-xs px-2 py-0.5 text-xs font-bold text-sky-800 uppercase ring-sky-800/50 hover:bg-sky-100 hover:ring">
                  RSVP
                </button>
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-start gap-y-1 pb-2 text-xs">
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                className="line-clamp-1 flex items-center justify-center gap-0.5 px-2 py-0.5 text-nowrap overflow-ellipsis text-sky-900/70 hover:bg-sky-50 hover:text-sky-900 hover:shadow-xs"
                href={{
                  pathname: "/",
                  query: {
                    t: tag.id,
                  },
                }}
              >
                <PiHash />
                {tag.name}
              </Link>
            ))}
            <p className="ml-auto block px-2 text-nowrap text-gray-500">
              {formatDistanceToNowStrict(post.createdAt)} ago
            </p>
          </div>
        </article>

        <div className="flex items-center gap-2 px-2 text-gray-700">
          <div className="rounded-full bg-white ring ring-gray-400">
            <VoteButton
              postId={post.id}
              score={post.score}
              vote={post.votes[0]?.value ?? null}
            />
          </div>

          <Link
            className="flex items-center gap-2 rounded-full bg-white px-2 py-1 leading-none ring ring-gray-400 hover:bg-sky-100 hover:ring-sky-800"
            href={`/discussion/${post.id}`}
          >
            <PiChatCircleTextBold />
            <span className="text-xs font-semibold">0</span>
          </Link>

          <Link
            className="flex items-center gap-2 rounded-full bg-white px-2 py-1 leading-none ring ring-gray-400 hover:bg-sky-100 hover:ring-sky-800"
            href={`/discussion/${post.id}`}
          >
            <PiShareFatBold />
            <span className="text-xs font-semibold">Share</span>
          </Link>

          <div className="ml-auto"></div>
        </div>
      </section>

      <section className="-mx-3 border-t border-gray-300 bg-gray-200 px-3 py-4">
        <div className="mx-auto w-full max-w-xl">
          <CommentEditor>
            <button className="flex w-full cursor-text items-center gap-2 rounded-sm border border-gray-400 bg-white px-3 py-1.5 text-left font-medium text-gray-500 hover:border-sky-800 hover:bg-sky-50 hover:text-sky-800/80">
              <PiChatCircleTextBold />
              Join the conversation...
            </button>
          </CommentEditor>
        </div>
      </section>

      <section className="-mx-3 h-screen bg-white px-3"></section>
    </div>
  );
}

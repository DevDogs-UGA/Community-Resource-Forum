import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { formatDistanceToNowStrict, getDate } from "date-fns";
import { desc, eq, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";
import {
  PiArrowElbowLeftUpBold,
  PiArrowRightBold,
  PiCalendarBlank,
  PiCaretDown,
  PiChatCircleText,
  PiChatCircleTextBold,
  PiClock,
  PiDotsThreeBold,
  PiHash,
  PiShareFatBold,
  PiTrendUp,
} from "react-icons/pi";
import * as z from "zod";
import Avatar from "~/components/Avatar";
import * as CommentEditor from "~/components/CommentEditor";
import ShareDropdown from "~/components/ShareDropdown";
import VoteButton from "~/components/VoteButton";
import formatEventTime from "~/lib/formatEventTime";
import { getSessionUser } from "~/server/auth";
import { db } from "~/server/db";
import {
  comments,
  commentVotes,
  posts,
  postVotes,
  type profiles,
} from "~/server/db/schema";

type Profile = (typeof profiles)["$inferSelect"];
type Comment = (typeof comments)["$inferSelect"];
type Vote = (typeof commentVotes)["$inferSelect"];

interface CommentWithJoins extends Comment {
  replies?: CommentWithJoins[];
  author: Profile;
  votes?: Vote[];
}

interface CommentProps extends CommentWithJoins {
  profiles?: Readonly<[Profile, ...Profile[]]>;
  sortBy: "popular" | "recent";
}

function Comment({
  id,
  author,
  content,
  createdAt,
  postId,
  score,
  votes,
  replyCount,
  replies,
  profiles,
  sortBy,
}: CommentProps) {
  return (
    <article
      className="mt-3 ml-3 border-l-2 border-gray-200 bg-white last:rounded-bl-lg last:border-transparent not-last:hover:border-gray-300 has-[>div:last-child>article:last-child]:pb-6 has-[>div:last-child>article>div:last-child>.absolute]:pb-15 last:[&>:nth-child(2)]:rounded-bl-lg last:[&>:nth-child(2)]:border-b-2 last:[&>:nth-child(2):has(+:empty)]:pb-3"
      key={id}
    >
      <Link
        className="group -mt-3 -ml-[calc(var(--spacing)*3+1px)] flex w-max items-center gap-2 text-2xl"
        href={`/profile/${author.id}`}
      >
        <Avatar {...author} />
        <span className="flex flex-col gap-0.5 text-sm *:leading-none">
          <span className="flex gap-1">
            <span className="font-semibold group-hover:underline">
              {author.name}
            </span>
            <span className="text-xs text-gray-500">
              {" "}
              &middot; {formatDistanceToNowStrict(createdAt)} ago
            </span>
          </span>
          {/* <span className="text-xs text-gray-600 capitalize">
            {author.type}
          </span> */}
        </span>
      </Link>

      <div className="-ml-0.5 border-l-2 border-gray-200 pb-6 transition-colors hover:border-gray-300 has-[+:not(:empty)]:rounded-bl-lg has-[+:not(:empty)]:border-b-2 has-[+:not(:empty)]:pb-6">
        <div
          className="prose prose-sm pt-1.5 pb-4.5 pl-5"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <CommentEditor.Root postId={postId} profiles={profiles} parentId={id}>
          <div className="mx-3 flex justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 sm:w-max sm:flex-row-reverse sm:justify-end">
            <div className="flex gap-[inherit]">
              <CommentEditor.Trigger>
                <button className="flex items-center gap-3 rounded-full pr-4 pl-1 leading-none hover:bg-sky-100 hover:ring hover:ring-sky-800">
                  <PiChatCircleText className="text-xl" />
                  <span className="text-xs font-semibold">{replyCount}</span>
                </button>
              </CommentEditor.Trigger>

              <ShareDropdown
                permalink={`https://community-resource-forum.vercel.app/discussion/${postId}/${id}`}
              >
                <button className="flex items-center gap-2 rounded-full px-2 py-1 leading-none hover:bg-sky-100 hover:ring hover:ring-sky-800">
                  <PiShareFatBold />
                  <span className="text-xs font-semibold">Share</span>
                </button>
              </ShareDropdown>
            </div>

            <div className="text-xs sm:pr-4">
              <VoteButton
                target={{ commentId: id }}
                score={score}
                value={votes?.[0]?.value ?? null}
              />
            </div>
          </div>

          <div className="px-3 pt-3 has-[[data-active=false]]:hidden">
            <CommentEditor.Slot />
          </div>
        </CommentEditor.Root>
      </div>

      <div className="relative -mt-[calc(var(--spacing)*6+1px)] pl-6 empty:hidden">
        {replies?.map((reply) => (
          <Comment
            {...reply}
            key={reply.id}
            profiles={profiles}
            sortBy={sortBy}
          />
        ))}

        {replyCount > (replies?.length ?? 0) && (
          <div className="absolute mt-3 ml-3 w-full bg-white">
            <Link
              className="flex w-max items-center gap-3 rounded-full border-2 border-gray-200 px-3 py-0.5 text-xs font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-800 hover:underline"
              href={`/discussion/${postId}/${id}?sortBy=${sortBy}`}
            >
              View more comments <PiArrowRightBold />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

const sort = {
  popular: desc(sql`${comments.score} + ${comments.replyCount}`),
  recent: desc(comments.createdAt),
};

const SearchParams = z.promise(
  z.object({
    sortBy: z
      .preprocess(
        (val): unknown => (val instanceof Array ? val[0] : val),
        z
          .string()
          .toLowerCase()
          .pipe(z.literal(["popular", "recent"])),
      )
      .catch("popular"),
    comment: z
      .string()
      .transform(() => true)
      .catch(false),
  }),
);

export default async function Page({
  params,
  searchParams,
}: PageProps<"/discussion/[...thread]">) {
  const [postId, parentId, ...rest] = (await params).thread;
  const { sortBy, comment } = await SearchParams.parseAsync(searchParams);
  const orderBy = sort[sortBy];

  const session = await getSessionUser({
    with: {
      profile: true,
      organizations: {
        with: {
          organization: true,
        },
      },
    },
  });

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
      comments: parentId
        ? {
            where: eq(comments.id, parentId),
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
                orderBy,
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
                    orderBy,
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
            orderBy,
            limit: 5,
            where: isNull(comments.parentId),
            with: {
              author: true,
              votes: session
                ? {
                    where: eq(commentVotes.userId, session.userId),
                    limit: 1,
                  }
                : undefined,
              replies: {
                orderBy,
                limit: 3,
                with: {
                  author: true,
                  votes: session
                    ? {
                        where: eq(commentVotes.userId, session.userId),
                        limit: 1,
                      }
                    : undefined,
                  replies: {
                    orderBy,
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
          },
    },
  });

  if (!post || (parentId && post.comments.length === 0)) {
    notFound();
  }

  const profiles = session
    ? ([
        session.user.profile,
        ...session.user.organizations
          .filter((rel) => rel.role === "officer" || rel.role === "owner")
          .map((rel) => rel.organization),
      ] as const)
    : undefined;

  const CommentEditorTrigger = ({ children }: PropsWithChildren) => {
    if (parentId) {
      return (
        <Link href={`/discussion/${postId}?sortBy=${sortBy}&comment`}>
          {children}
        </Link>
      );
    }

    return <CommentEditor.Trigger>{children}</CommentEditor.Trigger>;
  };

  const CommentEditorSlot = ({ children }: PropsWithChildren) => {
    if (parentId) {
      return (
        <Link href={`/discussion/${postId}?sortBy=${sortBy}&comment`}>
          {children}
        </Link>
      );
    }

    return <CommentEditor.Slot>{children}</CommentEditor.Slot>;
  };

  return (
    <div className="px-3">
      <CommentEditor.Root
        postId={post.id}
        profiles={profiles}
        defaultActive={comment}
      >
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

          <div className="flex items-center gap-2 px-px text-sm text-gray-700">
            <div className="rounded-full bg-white px-px ring ring-gray-400">
              <VoteButton
                target={{ postId: post.id }}
                score={post.score}
                value={post.votes?.[0]?.value ?? null}
              />
            </div>

            <CommentEditorTrigger>
              <button className="flex items-center gap-4 rounded-full bg-white py-1 pr-6 pl-2 leading-none ring ring-gray-400 hover:bg-sky-100 hover:ring-sky-800">
                <PiChatCircleTextBold className="text-xl" />
                <span className="font-semibold">{post.commentCount}</span>
              </button>
            </CommentEditorTrigger>

            <ShareDropdown
              permalink={`https://community-resource-forum.vercel.app/discussion/${post.id}`}
            >
              <button className="flex items-center gap-4 rounded-full bg-white py-1 pr-6 pl-2 leading-none ring ring-gray-400 hover:bg-sky-100 hover:ring-sky-800">
                <PiShareFatBold className="text-xl" />
                <span className="font-semibold">Share</span>
              </button>
            </ShareDropdown>

            <div className="ml-auto"></div>
          </div>
        </section>

        <section className="-mx-3 border-t border-gray-300 bg-gray-200 px-3 py-4">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
            <CommentEditorSlot>
              <button className="flex w-full cursor-text items-center gap-2 rounded-sm border border-gray-400 bg-white px-3 py-1.5 text-left font-medium text-gray-500 hover:border-sky-800 hover:bg-sky-50 hover:text-sky-800/80">
                <PiChatCircleTextBold />
                Join the conversation...
              </button>
            </CommentEditorSlot>

            <div className="flex items-center">
              <p className="flex-1 text-xs">
                {parentId && (
                  <Link
                    className="flex items-center gap-2 px-2 text-gray-700 hover:text-black hover:underline"
                    href={`/discussion/${postId}?sortBy=${sortBy}`}
                  >
                    <PiArrowElbowLeftUpBold />
                    View all comments
                  </Link>
                )}
              </p>

              <Dropdown.Root>
                <Dropdown.Trigger asChild suppressHydrationWarning>
                  <label className="flex items-center gap-2 text-xs text-gray-800">
                    <span className="pb-0.5">Sort by:</span>
                    <button
                      className="flex items-center gap-6 rounded-sm border-b-2 border-gray-200 bg-white px-2 py-1 capitalize ring ring-gray-400 hover:border-gray-300 hover:text-black hover:ring-gray-500"
                      type="button"
                    >
                      {sortBy}
                      <PiCaretDown />
                    </button>
                  </label>
                </Dropdown.Trigger>

                <Dropdown.Portal>
                  <Dropdown.Content
                    className="z-50 flex min-w-40 flex-col rounded-md border border-gray-400 bg-white py-1.5 text-sm shadow-xl"
                    align="end"
                    sideOffset={4}
                  >
                    <Dropdown.Item asChild>
                      <Link
                        href={`/discussion/${postId}${parentId ? `${parentId}` : ""}?sortBy=popular`}
                        className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                      >
                        <PiTrendUp />
                        Popular
                      </Link>
                    </Dropdown.Item>

                    <Dropdown.Item asChild>
                      <Link
                        href={`/discussion/${postId}${parentId ? `${parentId}` : ""}?sortBy=recent`}
                        className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                      >
                        <PiClock />
                        Recent
                      </Link>
                    </Dropdown.Item>
                  </Dropdown.Content>
                </Dropdown.Portal>
              </Dropdown.Root>
            </div>
          </div>
        </section>
      </CommentEditor.Root>

      <section className="-mx-3 border-y border-gray-300 bg-white px-3 py-4">
        <div className="mx-auto w-full max-w-xl">
          {post.comments.map((comment) => (
            <Comment
              {...comment}
              key={comment.id}
              profiles={profiles}
              sortBy={sortBy}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

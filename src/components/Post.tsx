import { formatDistanceToNowStrict, getDate } from "date-fns";
import Link from "next/link";
import {
  PiCalendarBlank,
  PiChatCircleTextBold,
  PiHash,
  PiShareFatBold
} from "react-icons/pi";
import Avatar from "~/components/Avatar";
import FlagButton from "~/components/FlagButton";
import ShareDropdown from "~/components/ShareDropdown";
import VoteButton from "~/components/VoteButton";
import formatEventTime from "~/lib/formatEventTime";
import type {
  events,
  postVotes,
  posts,
  profiles,
  sessions, 
} from "~/server/db/schema";

export default function Post({
  post,
  profile: author,
  event,
  vote,
  session,
  readonly = false,
}: {
  post: typeof posts.$inferSelect;
  profile: typeof profiles.$inferSelect;
  event: typeof events.$inferSelect;
  vote: typeof postVotes.$inferSelect | null;
  session: typeof sessions.$inferSelect | null;
  readonly?: boolean;
}) {
  return (
    <article
      key={post.id}
      className="rounded-md border border-gray-300 bg-white px-2"
    >
      <div className="flex flex-col gap-2 px-2 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Link
              href={`/users/${author.id}`}
              className="group flex items-center gap-3 text-3xl"
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
          </div>

          {session && (
            <FlagButton
              postId={post.id}
              userId={session.userId}
              disabled={readonly}
            />
          )}
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

        <div className="flex items-center justify-between border-t border-t-gray-200 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="#"
              className="flex items-center gap-1 text-sky-900/70 hover:text-sky-900 hover:underline"
            >
              <PiHash />
              Dev Dogs
            </Link>
          </div>
          <p className="text-gray-500">
            {formatDistanceToNowStrict(post.createdAt)} ago
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-t-gray-300 py-3 pr-2 pl-1 text-gray-700">
          <Link
            className="flex items-center gap-1.5 rounded-full px-2 py-1 leading-none hover:bg-sky-100 hover:ring hover:ring-sky-800"
            href={`/discussion/${post.id}?comment`}
          >
            <PiChatCircleTextBold />
            <span className="text-xs font-semibold">0</span>
          </Link>

          <ShareDropdown
            permalink={`https://community-resource-forum.vercel.app/discussion/${post.id}`}
          >
            <button className="flex items-center gap-1.5 rounded-full px-2 py-1 leading-none hover:bg-sky-100 hover:ring hover:ring-sky-800">
              <PiShareFatBold />
              <span className="text-xs font-semibold">Share</span>
            </button>
          </ShareDropdown>

          <div className="ml-auto scale-90">
            <VoteButton
              target={{ postId: post.id }}
              score={post.score ?? 0}
              value={vote ? vote.value : null}
              disabled={true}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

import { getDate } from "date-fns";
import Link from "next/link";
import {
  PiCalendarBlank,
  PiChatCircleTextBold,
  PiDotsThreeBold,
  PiShareFatBold,
} from "react-icons/pi";
import Avatar from "~/components/Avatar";
import FlagButton from "~/components/FlagButton";
import LikeButton from "~/components/LikeButton";
import ShareButton from "~/components/ShareButton";
import formatEventTime from "~/lib/formatEventTime";
// import { getSessionUser } from "~/server/auth";
// import { db } from "~/server/db";
import type { events, likes, posts, profiles, sessions } from "~/server/db/schema";

export default function Post(
    { 
        post, 
        profile: author, 
        event, 
        like, 
        session 
    } : { 
        post: typeof posts.$inferSelect, 
        profile: typeof profiles.$inferSelect, 
        event: typeof events.$inferSelect, 
        like: typeof likes.$inferSelect | null, 
        session: typeof sessions.$inferSelect | null 
    }) {
    return (
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

                <FlagButton postId={post.id} userId={session?.userId ?? ""} />

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

            <div className="flex justify-between gap-2 border-t border-t-gray-300 px-2 py-3 text-gray-700">
                <LikeButton
                postId={post.id}
                likeCount={post.likeCount}
                likeStatus={!!like}
                />
                <button className="flex items-center gap-2 rounded-sm px-2 py-1 leading-none hover:bg-green-100">
                <PiChatCircleTextBold />
                {/* <span className="text-xs font-semibold">33</span> */}
                </button>
                <ShareButton
                link={`https://community-resource-forum.vercel.app/events/${post.eventId}`}
                />
            </div>
            </article>
    ); 
}
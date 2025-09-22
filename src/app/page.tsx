import { getDate } from "date-fns";
import Link from "next/link";
import {
  PiCalendarBlank,
  PiChatCircleTextBold,
  PiDotsThreeBold,
  PiHeartBold,
  PiShareFatBold,
} from "react-icons/pi";
import Avatar from "~/components/Avatar";
import { db } from "~/db";
import formatEventTime from "~/lib/formatEventTime";

export default async function HomePage() {
  const posts = await db.query.posts.findMany({
    with: { author: true, event: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-md border border-gray-300 bg-white px-2"
        >
          <div className="flex flex-col gap-2 px-2 py-4">
            <div className="flex items-start gap-3">
              <Link
                href={`/users/${post.author.id}`}
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
                href={`/events/${post.eventId}`}
              >
                <span className="relative">
                  <PiCalendarBlank />
                  <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-px text-center text-[0.55rem] font-bold">
                    {getDate(post.event.start)}
                  </span>
                </span>

                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm/[1]">{post.event.title}</span>
                  <span className="text-[0.6rem]/[1] font-bold text-gray-600">
                    {formatEventTime(post.event)}
                  </span>
                </span>

                <button className="rounded-xs px-2 text-xs font-bold text-sky-800 uppercase ring-sky-800/50 py-0.5 hover:bg-sky-100 hover:ring">
                  RSVP
                </button>
              </Link>
            )}
          </div>

          <div className="flex justify-between gap-2 border-t border-t-gray-300 px-2 py-3 text-gray-700">
            <button className="flex items-center gap-2 rounded-sm px-2 py-1 leading-none hover:bg-rose-100">
              <PiHeartBold />
              <span className="text-xs font-semibold">945</span>
            </button>
            <button className="flex items-center gap-2 rounded-sm px-2 py-1 leading-none hover:bg-green-100">
              <PiChatCircleTextBold />
              <span className="text-xs font-semibold">33</span>
            </button>
            <button className="flex items-center gap-2 rounded-sm px-2 py-1 leading-none hover:bg-sky-100">
              <PiShareFatBold />
              <span className="text-xs font-semibold">12</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

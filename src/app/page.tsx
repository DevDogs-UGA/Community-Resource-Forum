import { getDate } from "date-fns";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  PiCalendarBlank,
  PiChatCircleTextBold,
  PiDotsThreeBold,
  PiShareFatBold,
} from "react-icons/pi";
import Avatar from "~/components/Avatar";
import LikeButton from "~/components/LikeButton";
import ShareButton from "~/components/ShareButton";
import formatEventTime from "~/lib/formatEventTime";
import { getSessionUser } from "~/server/auth";
import PostImageGallery from "~/components/PostImgGallery";
import { db } from "~/server/db";
import { events, likes, posts, profiles } from "~/server/db/schema";
export default async function HomePage() {
  console.log("TESTING!")
  const session = await getSessionUser();
  const results = await db
    .select()
    .from(posts)
    .orderBy(asc(posts.createdAt))
    .limit(20)
    .offset(0)
    .leftJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(events, eq(posts.eventId, events.id))
    .leftJoin(
      likes,
      and(eq(likes.userId, session?.userId ?? ""), eq(likes.postId, posts.id)),
    );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
      {results.map(({ post, profile: author, event, like }) => (
        <article
          key={post.id}
          className="rounded-md border border-gray-300 bg-white px-2"
        >
          <div className="flex flex-col gap-2 px-2 py-4">
            <div className="flex items-start gap-3">
              <Link
                href={`/users/${author!.id}`}
                className="group flex flex-1 items-center gap-3 text-3xl"
              >
                <Avatar {...author!} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm leading-none font-bold group-hover:underline">
                    {author!.name}
                  </span>
                  <span className="text-xs leading-none text-gray-600 capitalize">
                    {author!.type}
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
            {/* Added for Testing */}
            <PostImageGallery
              images={[
                "https://images.pexels.com/photos/1366242/pexels-photo-1366242.jpeg",
                "https://images.pexels.com/photos/6969890/pexels-photo-6969890.jpeg",
                "https://images.pexels.com/photos/32655300/pexels-photo-32655300.jpeg",
                "https://images.pexels.com/photos/32276165/pexels-photo-32276165.jpeg",
                "https://images.pexels.com/photos/34120850/pexels-photo-34120850.jpeg",

              ]} />

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

                <span className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm/[1.25] -mt-0.5 overflow-x-hidden overflow-ellipsis">{event.title}</span>
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
      ))}
    </div>
  );
}

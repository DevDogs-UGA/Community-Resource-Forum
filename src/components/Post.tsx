import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";
import {
  PiChatCircleTextBold,
  PiHash,
  PiShareFatBold
} from "react-icons/pi";
import Avatar from "~/components/Avatar";
import ShareDropdown from "~/components/ShareDropdown";
import VoteButton from "~/components/VoteButton";
import type * as tables from "~/server/db/schema/tables";
import AttachmentBadge from "./AttachmentBadge";

interface Props {
  post: typeof tables.posts.$inferSelect;
  author: typeof tables.profiles.$inferSelect;
  event?: typeof tables.events.$inferSelect | null;
  tags: (typeof tables.tags.$inferSelect)[];
  attachments: (typeof tables.postAttachments.$inferSelect)[];
  vote?: typeof tables.postVotes.$inferSelect | null;
  tagParam: string[];
  readonly?: boolean;
}

export default function Post({
  post,
  author,
  event,
  vote,
  tags,
  tagParam,
  readonly = false,
}: Props) {
  return (
    <article key={post.id} className="bg-white px-2">
      <div className="flex flex-col gap-2 px-2 py-4">
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${author.id}`}
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
        </div>

        {post.content && (
          <div
            className="prose prose-sm"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        {event && <AttachmentBadge event={event} />}
      </div>

      <div className="flex flex-wrap items-center justify-start gap-y-1 pb-2 text-xs">
        {Array.from(tags).map((tag) => (
          <Link
            key={tag.id}
            className="line-clamp-1 flex items-center justify-center gap-0.5 px-2 py-0.5 text-nowrap overflow-ellipsis text-sky-900/70 hover:bg-sky-50 hover:text-sky-900 hover:shadow-xs"
            href={{
              pathname: "/",
              query: {
                t: tagParam.includes(tag.id) ? tagParam : [tag.id, ...tagParam],
              },
            }}
            target={readonly ? "_blank" : undefined}
          >
            <PiHash />
            {tag.name}
          </Link>
        ))}
        <p className="ml-auto block px-2 text-nowrap text-gray-500">
          {formatDistanceToNowStrict(post.createdAt)} ago
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-t-gray-300 py-3 pr-2 pl-1 text-gray-700">
        <Link
          className="flex items-center gap-2 rounded-full px-2 py-1 leading-none hover:bg-sky-100 hover:ring hover:ring-sky-800"
          href={`/discussion/${post.id}?comment`}
          target={readonly ? "_blank" : undefined}
        >
          <PiChatCircleTextBold />
          <span className="text-xs font-semibold">{post.commentCount}</span>
        </Link>

        <ShareDropdown
          permalink={`https://community-resource-forum.vercel.app/discussion/${post.id}`}
        >
          <button className="flex items-center gap-2 rounded-full px-2 py-1 leading-none hover:bg-sky-100 hover:ring hover:ring-sky-800">
            <PiShareFatBold />
            <span className="text-xs font-semibold">Share</span>
          </button>
        </ShareDropdown>

        <div className="ml-auto text-xs">
          <VoteButton
            disabled={readonly}
            target={{ postId: post.id }}
            score={post.score}
            value={vote?.value ?? null}
          />
        </div>
      </div>
    </article>
  );
}

import { and, gt, not } from "drizzle-orm";
import { db } from "~/server/db";
import { posts as postsTable } from "~/server/db/schema";

import Post from "~/components/Post";
import { PiChecksBold, PiTrashBold } from "react-icons/pi";
import * as z from "zod";
import { quarantinePost, resetDownvotes } from "~/server/actions/moderate";

interface DecisionFormProps {
  post: typeof postsTable.$inferSelect;
}

function DecisionForm({ post }: DecisionFormProps) {
  const { description, voteCount, voteKey } = (
    [
      {
        description: "outdated or incorrect information",
        voteCount: post.downvoteIncorrectCount,
        voteKey: "down.incorrect",
      },
      {
        description: "harmful or offensive content",
        voteCount: post.downvoteHarmfulCount,
        voteKey: "down.harmful",
      },
      {
        description: "spam or deceptive content",
        voteCount: post.downvoteSpamCount,
        voteKey: "down.spam",
      },
    ] as const
  )
    .filter((a) => a.voteCount > 0)
    .toSorted((a, b) => b.voteCount - a.voteCount)[0]!;

  return (
    <form className="contents">
      <input className="hidden" type="hidden" name="postId" value={post.id} />
      <input className="hidden" type="hidden" name="voteKey" value={voteKey} />
      <p className="bg-gray-200 py-4 text-center">
        <span className="inline-block font-bold">{voteCount} users</span>{" "}
        downvoted this post for containing{" "}
        <span className="block font-bold">{description}</span>
      </p>
      <div className="-mx-px -mb-px grid grid-cols-2">
        <button
          className="flex items-center justify-center gap-2 rounded-bl-md bg-green-200 py-2.5 text-green-950 inset-ring-1 inset-ring-green-900 transition-shadow hover:inset-ring-3"
          formAction={resetDownvotes}
        >
          <PiChecksBold /> Mark as Safe
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-br-md bg-red-200 py-2.5 text-red-950 inset-ring-1 inset-ring-red-900 transition-shadow hover:inset-ring-3"
          formAction={quarantinePost}
        >
          <PiTrashBold /> Quarantine Post
        </button>
      </div>
    </form>
  );
}

const searchParamsSchema = z.object({
  page: z.coerce.number().pipe(z.int().min(0)).default(0),
});

export default async function FlaggedPage({
  searchParams,
}: PageProps<`/moderate/review/posts`>) {
  const params = await searchParamsSchema
    .parseAsync(await searchParams)
    .catch(() => ({
      page: 0,
    }));

  const posts = await db.query.posts.findMany({
    where: and(gt(postsTable.downvoteCount, 0), not(postsTable.quarantined)),
    orderBy: postsTable.downvoteCount,
    with: {
      author: true,
      event: true,
    },
    offset: params.page * 20,
    limit: 20,
  });

  if (posts.length < 1) {
    return (
      <div className="mx-auto flex h-screen w-full max-w-xl flex-col gap-6 px-6 py-6">
        <p className="max-w-prose text-center text-gray-600">
          There are no posts to review.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-xl flex-col gap-6 px-6 py-6">
      {posts.map((post) => (
        <div
          className="rounded-md border border-gray-300 text-sm"
          key={post.id}
        >
          <Post
            post={post}
            profile={post.author}
            event={post.event!}
            vote={null}
            session={null}
            readonly
          />

          <DecisionForm post={post} />
        </div>
      ))}
    </div>
  );
}

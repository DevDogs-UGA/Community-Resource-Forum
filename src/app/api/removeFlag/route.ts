import { db } from "~/server/db";
import { flags, posts } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function PATCH(request: Request) {
  try {
    const data: unknown = await request.json();

    if (
      !(
        typeof data === "object" &&
        data !== null &&
        "userId" in data &&
        typeof data.userId === "string" &&
        "postId" in data &&
        typeof data.postId === "string"
      )
    ) {
      return new Response("Missing userId or postId", { status: 400 });
    }

    const { userId, postId } = data;

    const existingPost = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
      .limit(1);

    if (existingPost.length === 0) {
      return new Response("Post not found or unauthorized", { status: 403 });
    }

    return await db.transaction(async (tx) => {

      await tx.delete(flags).where(eq(flags.postId, postId));

    });

    return new Response("Post restored successfully", { status: 200 });
  } catch (error) {
    console.error("Error restoring post:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
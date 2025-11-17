import { db } from "~/server/db";
import { flags, posts } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";

// Insert New Flag
export async function POST(request: Request) {
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
    return await db.transaction(async (tx) => {
      // Check if flag already exists
      const existingFlag = await tx
        .select()
        .from(flags)
        .where(and(eq(flags.userId, userId), eq(flags.postId, postId)));

      if (existingFlag.length > 0) {
        return new Response("Flag already exists", { status: 200 }); // cancels the entire transaction
      }

      // Insert new flag
      await tx.insert(flags).values({ userId, postId });

      // Increment Flag Count
      await tx
        .update(posts)
        .set({ flagCount: sql`${posts.flagCount} + 1` })
        .where(eq(posts.id, postId));

      return new Response("Flag created", { status: 201 });
    });
  } catch (error: unknown) {
    // Detect duplicate key errors specifically

    console.error("Error creating flag:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Delete Existing Flag
export async function DELETE(request: Request) {
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

    return await db.transaction(async (tx) => {
      const existingFlag = await tx
        .select()
        .from(flags)
        .where(and(eq(flags.userId, userId), eq(flags.postId, postId)))
        .limit(1); // max one flag per user

      if (existingFlag.length === 0) {
        return new Response("Flag not found", { status: 404 });
      }

      // Delete the flag
      await tx
        .delete(flags)
        .where(and(eq(flags.userId, userId), eq(flags.postId, postId)));

      await tx
        .update(posts)
        .set({ flagCount: sql`${posts.flagCount} - 1` })
        .where(eq(posts.id, postId));

      return new Response("Flag deleted", { status: 200 });
    });
  } catch (error) {
    console.error("Error deleting flag:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

import { db } from "~/server/db";
import {
  posts,
  postVotes,
  comments,
  commentVotes,
  flags,
  tagsToPosts,
} from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// Delete a post and all associated data
// Expects userId, postId
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

    // Ensure post exists and belongs to the user
    const existingPost = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
      .limit(1);

    if (existingPost.length === 0) {
      return new Response("Post not found or unauthorized", { status: 403 });
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Get all comment IDs for this post (for cascading deletions)
      const commentIds = (
        await tx
          .select({ id: comments.id })
          .from(comments)
          .where(eq(comments.postId, postId))
      ).map((c) => c.id);

      // Delete comment votes tied to those comments
      if (commentIds.length > 0) {
        await tx
          .delete(commentVotes)
          .where(inArray(commentVotes.commentId, commentIds));
      }

      // Delete post votes
      await tx.delete(postVotes).where(eq(postVotes.postId, postId));

      // Delete flags
      await tx.delete(flags).where(eq(flags.postId, postId));

      // Delete tags linking this post
      await tx.delete(tagsToPosts).where(eq(tagsToPosts.postId, postId));

      // Delete comments themselves
      await tx.delete(comments).where(eq(comments.postId, postId));

      // Finally, delete the post itself
      await tx
        .delete(posts)
        .where(and(eq(posts.id, postId), eq(posts.authorId, userId)));
    });

    return new Response("Post and related data deleted successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Delete a post and all associated data from posts table and insert into archivedPosts table 
// Expects userId, postId
// export async function PUT(request: Request) {
//   try {
//     const data: unknown = await request.json(); 

//     if (
//       !(
//         typeof data === "object" &&
//         data !== null &&
//         "userId" in data &&
//         typeof data.userId === "string" &&
//         "postId" in data &&
//         typeof data.postId === "string"
//       )
//     ) {
//       return new Response("Missing userId or postId", { status: 400 });
//     }

//     const { userId, postId } = data; 

//     await db.transaction(async (tx) => {
//       // Fetch the post to be archived
//       const postToArchive = await tx
//         .select()
//         .from(posts)
//         .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
//         .limit(1);

//       if (postToArchive.length === 0) {
//         throw new Error("Post not found or unauthorized");
//       }

//       const post = postToArchive[0];

//       // Insert into archivedPosts table
//       await tx.insert(archivedPosts).values({
//         id: post!.id,
//         authorId: post!.authorId,
//         // title: post.title,
//         content: post!.content,
//         createdAt: post!.createdAt,
//         updatedAt: post!.updatedAt,
//       });

//       // Delete the original post
//       await tx.delete(posts).where(and(eq(posts.id, postId), eq(posts.authorId, userId)));
//     });

//     return new Response("Post archived successfully", {
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error archiving post:", error);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }

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
    
    // Ensure post exists and belongs to the user
    const existingPost = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
      .limit(1); 

    if (existingPost.length === 0) {
      return new Response("Post not found or unauthorized", { status: 403 });
    }
    
    // Archive the post by moving it to archivedPosts table
    await db.update(posts)
      .set({ archived: true })
      .where(and(eq(posts.id, postId), eq(posts.authorId, userId))); 

    return new Response("Post archived successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error archiving post:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 

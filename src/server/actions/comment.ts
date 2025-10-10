"use server";

import { eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import * as z from "zod";
import * as zfd from "zod-form-data";
import { getSessionUser } from "../auth";
import { db } from "../db";
import { comments, posts } from "../db/schema";
import { increment } from "../db/utils";

const schema = zfd.formData({
  authorId: zfd.text(),
  postId: zfd.text(),
  parentId: zfd.text(z.string().optional()),
  content: zfd.text().transform((s, ctx) => {
    try {
      const obj: unknown = JSON.parse(s);

      if (obj instanceof Array) {
        return new QuillDeltaToHtmlConverter(obj, {}).convert();
      }

      throw new Error("Parsed JSON not instance of array");
    } catch (e) {
      console.error(e);
      ctx.addIssue({ code: "custom", message: "Invalid JSON" });
      return z.NEVER;
    }
  }),
});

export default async function comment(_prevState: unknown, formData: FormData) {
  try {
    const { content, authorId, postId, parentId } =
      await schema.parseAsync(formData);

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

    if (
      !session ||
      (authorId !== session.userId &&
        !session.user.organizations.some(
          (org) => org.organizationId === authorId && org.role !== "member",
        ))
    ) {
      throw new Error("Not signed in.");
    }

    // const parent = parentId ? await db.query.comments.findFirst({ where: eq(comments.id, parentId) }) : null;

    // if (parentId && !parent) {
    //   return { success: false };
    // }

    // const [insertedComment] = await db
    //   .insert(comments)
    //   .values({
    //     depth,
    //     authorId,
    //     content,
    //     postId,
    //     parentId,
    //   })
    //   .$returningId();

    // console.log(`/discussion/${postId}/${insertedComment!.id}`);

    await db.transaction(async (tx) => {
      const [insertedComment] = await db
        .insert(comments)
        .values({
          authorId,
          postId,
          parentId,
          content,
        })
        .$returningId();

      if (!insertedComment) {
        tx.rollback();
        throw new Error("🍸 How did we get here?");
      }

      if (parentId) {
        await db
          .update(comments)
          .set({ replyCount: increment(comments.replyCount) })
          .where(eq(comments.id, parentId));
      }

      await db
        .update(posts)
        .set({ commentCount: increment(posts.commentCount) })
        .where(eq(posts.id, postId));
    });

    redirect(
      `/discussion/${postId}${parentId ? `/${parentId}` : ""}?sortBy=recent`,
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error(error);
    return { success: false };
  }
}

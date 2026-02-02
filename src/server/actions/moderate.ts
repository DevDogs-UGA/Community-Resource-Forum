"use server";
import { eq } from "drizzle-orm";
import { notFound, unauthorized } from "next/navigation";
import * as z from "zod";
import * as zfd from "zod-form-data";
import { expectSessionUser } from "../auth";
import { db } from "../db";
import { posts } from "../db/schema";
import { revalidatePath } from "next/cache";

const schema = zfd.formData({
  voteKey: zfd.text(z.enum(["down.incorrect", "down.harmful", "down.spam"])),
  postId: zfd.text(),
});

const keyMap = {
  "down.incorrect": "downvoteIncorrectCount",
  "down.harmful": "downvoteHarmfulCount",
  "down.spam": "downvoteSpamCount",
};

export async function resetDownvotes(formData: FormData) {
  const session = await expectSessionUser();

  if (session.user.role !== "moderator") {
    unauthorized();
  }

  const { postId, voteKey } = await schema
    .parseAsync(formData)
    .catch(() => notFound());

  const [result] = await db
    .update(posts)
    .set({ [keyMap[voteKey]]: 0 })
    .where(eq(posts.id, postId));

  if (result.affectedRows < 1) {
    notFound();
  }

  revalidatePath("/moderate/posts", "page");
}

export async function quarantinePost(formData: FormData) {
  const session = await expectSessionUser();

  if (session.user.role !== "moderator") {
    unauthorized();
  }

  const { postId } = await schema.parseAsync(formData).catch(() => notFound());
  const [result] = await db
    .update(posts)
    .set({ quarantined: true })
    .where(eq(posts.id, postId));

  if (result.affectedRows < 1) {
    notFound();
  }

  revalidatePath("/moderate/posts", "page");
}

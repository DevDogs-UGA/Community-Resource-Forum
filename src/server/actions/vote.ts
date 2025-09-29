"use server";

import { and, eq, sql } from "drizzle-orm";
import * as z from "zod";
import * as zfd from "zod-form-data";
import { getSessionUser } from "../auth";
import { db } from "../db";
import { posts, votes } from "../db/schema";
import signIn from "./signIn";

interface PrevState {
  score: number;
  vote: typeof votes.$inferSelect.value | null;
}

const schema = zfd.formData({
  postId: zfd.text(),
  vote: zfd.text(z.enum(["up", "down.incorrect", "down.harmful", "down.spam"])),
});

function valueOf(vote?: PrevState["vote"]) {
  switch (vote) {
    case "up":
      return 1;
    case undefined:
      return 0;
    case null:
      return 0;
    default:
      return -1;
  }
}

export default async function vote(prevState: PrevState, formData: FormData) {
  const session = await getSessionUser();

  if (session === null) {
    await signIn();
    throw new Error("🍸 How did we get here?");
  }

  const { postId, vote } = await schema.parseAsync(formData);

  return await db.transaction(async (tx) => {
    const [existingVote] = await tx
      .select()
      .from(votes)
      .where(and(eq(votes.postId, postId), eq(votes.userId, session.userId)))
      .limit(1);

    const newVote = vote !== existingVote?.value ? vote : null;

    if (newVote) {
      await tx
        .insert(votes)
        .values({ postId, userId: session.userId, value: newVote })
        .onDuplicateKeyUpdate({
          set: {
            value: sql`values(${votes.value})`,
          },
        });
    } else {
      await tx
        .delete(votes)
        .where(and(eq(votes.postId, postId), eq(votes.userId, session.userId)));
    }

    const difference = valueOf(newVote) - valueOf(existingVote?.value);

    await tx
      .update(posts)
      .set({ score: sql`${posts.score} + ${difference}` })
      .where(eq(posts.id, postId));

    return { score: prevState.score + difference, vote: newVote } satisfies PrevState;
  });
}

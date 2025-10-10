"use server";

import { and, eq, sql } from "drizzle-orm";
import * as z from "zod";
import * as zfd from "zod-form-data";
import { getSessionUser } from "../auth";
import { db } from "../db";
import {
  comments,
  commentVotes,
  posts,
  postVotes,
  type voteValue,
} from "../db/schema";
import signIn from "./signIn";

export interface PrevState {
  score: number;
  value?: typeof voteValue._.data | null;
}

const schema = zfd.formData(
  z
    .object({
      value: zfd.text(
        z.enum(["up", "down.incorrect", "down.harmful", "down.spam"]),
      ),
    })
    .and(
      z.union([
        z.object({
          postId: zfd.text(),
        }),
        z.object({
          commentId: zfd.text(),
        }),
      ]),
    ),
);

function valueOf(vote?: PrevState["value"]) {
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

  const data = await schema.parseAsync(formData);

  const target =
    "postId" in data
      ? {
          contentId: data.postId,
          contentTable: posts,
          votesTable: postVotes,
          votesTableContentIdColumn: "postId",
          votesTableContentIdCondition: eq(postVotes.postId, data.postId),
        }
      : {
          contentId: data.commentId,
          contentTable: comments,
          votesTable: commentVotes,
          votesTableContentIdColumn: "commentId",
          votesTableContentIdCondition: eq(
            commentVotes.commentId,
            data.commentId,
          ),
        };

  return await db.transaction(async (tx) => {
    const [existingVote] = await tx
      .select()
      .from(target.votesTable)
      .where(
        and(
          target.votesTableContentIdCondition,
          eq(target.votesTable.userId, session.userId),
        ),
      )
      .limit(1);

    const newVote = data.value !== existingVote?.value ? data.value : null;

    if (newVote) {
      await tx
        .insert(target.votesTable)
        .values({
          [target.votesTableContentIdColumn]: target.contentId,
          userId: session.userId,
          value: newVote,
        })
        .onDuplicateKeyUpdate({
          set: {
            value: sql`values(${target.votesTable.value})`,
          },
        });
    } else {
      await tx
        .delete(target.votesTable)
        .where(
          and(
            target.votesTableContentIdCondition,
            eq(target.votesTable.userId, session.userId),
          ),
        );
    }

    const difference = valueOf(newVote) - valueOf(existingVote?.value);

    await tx
      .update(target.contentTable)
      .set({ score: sql`${target.contentTable.score} + ${difference}` })
      .where(eq(target.contentTable.id, target.contentId));

    return {
      score: prevState.score + difference,
      value: newVote,
    } satisfies PrevState;
  });
}

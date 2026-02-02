"use server";

import { and, eq, sql } from "drizzle-orm";
import * as z from "zod";
import * as zfd from "zod-form-data";
import { expectSessionUser, getSessionUser } from "../auth";
import { db } from "../db";
import {
  comments,
  commentVotes,
  posts,
  postVotes,
  type voteValue,
} from "../db/schema";
import signIn from "./signIn";
import { increment } from "../db/utils";

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

export default async function vote(prevState: PrevState, formData: FormData) {
  const session = await expectSessionUser();
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

    const calculateDelta = (reference: (PrevState["value"] & {}) | "down") => {
      return (
        (newVote?.startsWith(reference) ? 1 : 0) -
        (existingVote?.value.startsWith(reference) ? 1 : 0)
      );
    };

    await tx
      .update(target.contentTable)
      .set({
        upvoteCount: increment(
          target.contentTable.upvoteCount,
          calculateDelta("up"),
        ),
        downvoteIncorrectCount: increment(
          target.contentTable.downvoteIncorrectCount,
          calculateDelta("down.incorrect"),
        ),
        downvoteHarmfulCount: increment(
          target.contentTable.downvoteHarmfulCount,
          calculateDelta("down.harmful"),
        ),
        downvoteSpamCount: increment(
          target.contentTable.downvoteSpamCount,
          calculateDelta("down.spam"),
        ),
      })
      .where(eq(target.contentTable.id, target.contentId));

    return {
      score: prevState.score + calculateDelta("up") - calculateDelta("down"),
      value: newVote,
    } satisfies PrevState;
  });
}

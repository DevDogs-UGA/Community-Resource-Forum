"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useCallback, useState } from "react";
import {
  PiArrowCircleDown,
  PiArrowCircleDownFill,
  PiArrowCircleUp,
  PiArrowCircleUpFill,
  PiClockAfternoon,
  PiSmileyXEyes,
  PiTrash,
} from "react-icons/pi";
import vote from "~/server/actions/vote";
import type { postVotes } from "~/server/db/schema";

function valueOf(vote?: typeof postVotes.$inferSelect.value | null) {
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

interface Props {
  score: number;
  value: typeof postVotes.$inferSelect.value | null;
  target: { postId: string } | { commentId: string };
  disabled?: boolean;
}

export default function VoteButton({ target, score, value, disabled }: Props) {
  const [formState, formAction, pending] = useActionState(vote, {
    score,
    value,
  });
  const [optimisticState, setOptimisticState] = useState({ score, value });
  const [dialogOpen, setDialogOpen] = useState(false);
  const state = pending ? optimisticState : formState;

  const optimisticVote = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
      setDialogOpen(false);

      const value = (e.nativeEvent.submitter?.getAttribute("value") ??
        null) as Props["value"];

      setOptimisticState({
        value,
        score: formState.score + valueOf(value) - valueOf(formState.value),
      });
    },
    [formState],
  );

  return (
    <form
      action={formAction}
      className="cursor-default rounded-full bg-linear-to-br ring-gray-400 not-[:has(:disabled)]:ring hover:bg-white has-disabled:cursor-not-allowed has-[[value=up]:hover]:from-green-200 has-[[value=up]:hover]:to-green-50 has-[[value=up]:hover]:text-green-900 has-[[value=up]:hover]:ring-green-900 has-[[value^=down]:hover]:from-rose-50 has-[[value^=down]:hover]:to-rose-200 has-[[value^=down]:hover]:text-rose-900 has-[[value^=down]:hover]:ring-rose-900 has-[[value^=down]:hover]:[&>[value=up]]:opacity-0 has-[[value=up]:hover]:[&>[value^=down]]:opacity-0"
      onSubmit={optimisticVote}
    >
      <input
        className="hidden"
        type="hidden"
        name={"postId" in target ? "postId" : "commentId"}
        value={"postId" in target ? target.postId : target.commentId}
      />

      {/* disabled:text-gray-600 data-[active=true]:disabled:text-emerald-800 */}
      <fieldset
        className="flex items-center gap-1 disabled:pointer-events-none disabled:opacity-60"
        disabled={disabled}
      >
        <button
          className="group text-[2em] leading-none transition-colors hover:text-green-700 data-[active=true]:text-green-700"
          data-active={state.value === "up"}
          name="value"
          value="up"
          type="submit"
        >
          <PiArrowCircleUp className="group-data-[active=true]:hidden" />
          <PiArrowCircleUpFill className="hidden text-green-700 group-data-[active=true]:block" />
        </button>

        <p className="min-w-5 text-center font-semibold">
          {/* TODO: Add large integer formatting using `Intl.NumberFormat` */}
          {state.score}
        </p>

        <button
          className="group text-[2em] leading-none transition-colors hover:text-rose-700 data-[active=true]:text-red-700"
          data-active={state.value?.startsWith("down")}
          name="value"
          value={state.value?.startsWith("down") ? state.value : "down.*"}
          type={state.value?.startsWith("down") ? "submit" : "button"}
          onClick={
            state.value?.startsWith("down")
              ? undefined
              : () => setDialogOpen(true)
          }
        >
          <PiArrowCircleDown className="group-data-[active=true]:hidden" />
          <PiArrowCircleDownFill className="hidden text-red-700 group-data-[active=true]:block" />
        </button>
      </fieldset>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 h-screen w-screen bg-black/30" />

          <Dialog.Content asChild>
            <form
              action={formAction}
              className="fixed top-1/2 left-1/2 z-50 mx-3 flex w-full max-w-sm -translate-1/2 flex-col gap-6 rounded-md bg-white px-6 py-6 shadow-lg"
              onSubmit={optimisticVote}
            >
              <input
                className="hidden"
                type="hidden"
                name={"postId" in target ? "postId" : "commentId"}
                value={"postId" in target ? target.postId : target.commentId}
              />

              <Dialog.Title className="text-center font-bold">
                Tell us more about why you&rsquo;re
                <br />
                downvoting this post:
              </Dialog.Title>

              <fieldset className="flex flex-col gap-2 text-sm">
                <button
                  className="flex w-full items-center gap-2 rounded-sm border-b-2 border-gray-200 bg-gray-50 px-3 py-1.5 text-left ring ring-gray-300 hover:mt-0.5 hover:border-b-0"
                  name="value"
                  value="down.incorrect"
                  type="submit"
                >
                  <PiClockAfternoon className="text-xl text-gray-600" />
                  It contains outdated or incorrect information.
                </button>

                <button
                  className="flex w-full items-center gap-2 rounded-sm border-b-2 border-gray-200 bg-gray-50 px-3 py-1.5 text-left ring ring-gray-300 hover:mt-0.5 hover:border-b-0"
                  name="value"
                  value="down.harmful"
                  type="submit"
                >
                  <PiSmileyXEyes className="text-xl text-gray-600" />
                  It contains harmful or offensive content.
                </button>

                <button
                  className="flex w-full items-center gap-2 rounded-sm border-b-2 border-gray-200 bg-gray-50 px-3 py-1.5 text-left ring ring-gray-300 hover:mt-0.5 hover:border-b-0"
                  name="value"
                  type="submit"
                  value="down.spam"
                >
                  <PiTrash className="text-xl text-gray-600" />
                  It is deceptive, misleading, or spam.
                </button>
              </fieldset>

              <Dialog.Description className="text-center text-xs text-gray-600">
                Your responses help maintain our community!
              </Dialog.Description>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </form>
  );
}

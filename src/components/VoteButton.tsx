"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useCallback, useState } from "react";
import {
  PiArrowCircleDown,
  PiArrowCircleDownFill,
  PiArrowCircleUp,
  PiArrowCircleUpBold,
  PiArrowCircleUpFill,
  PiArrowFatDownBold,
  PiArrowFatDownFill,
  PiArrowFatUpBold,
  PiArrowFatUpFill,
} from "react-icons/pi";
import vote from "~/server/actions/vote";
import type { votes } from "~/server/db/schema";

interface Props {
  postId: string;
  score: number;
  vote: typeof votes.$inferSelect.value | null;
}

function valueOf(vote?: typeof votes.$inferSelect.value | null) {
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

export default function VoteButton({ postId, ...defaultState }: Props) {
  const [formState, formAction, pending] = useActionState(vote, defaultState);
  const [optimisticState, setOptimisticState] = useState(defaultState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const state = pending ? optimisticState : formState;

  const optimisticVote = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
      setDialogOpen(false);

      const vote = (e.nativeEvent.submitter?.getAttribute("value") ??
        null) as Props["vote"];

      setOptimisticState({
        vote,
        score: formState.score + valueOf(vote) - valueOf(formState.vote),
      });
    },
    [formState],
  );

  return (
    <form
      action={formAction}
      className="flex cursor-default items-center gap-1 rounded-sm"
      onSubmit={optimisticVote}
    >
      <input className="hidden" type="hidden" name="postId" value={postId} />

      <button
        className="group leading-none hover:text-green-700 data-[active=true]:text-green-700 text-2xl"
        data-active={state.vote === "up"}
        name="vote"
        value="up"
        type="submit"
      >
        <PiArrowCircleUp className="group-[[data-active=true]]:hidden" />
        <PiArrowCircleUpFill className="hidden text-green-700 group-[[data-active=true]]:block" />
      </button>

      <p className="text-xs font-bold min-w-5 text-center">
        {/* TODO: Add large integer formatting using `Intl.NumberFormat` */}
        {state.score}
      </p>

      <button
        className="group leading-none hover:text-red-700 data-[active=true]:text-red-700 text-2xl"
        data-active={state.vote?.startsWith("down")}
        name="vote"
        value={state.vote?.startsWith("down") ? state.vote : undefined}
        type={state.vote?.startsWith("down") ? "submit" : "button"}
        onClick={
          state.vote?.startsWith("down") ? undefined : () => setDialogOpen(true)
        }
      >
          <PiArrowCircleDown className="group-[[data-active=true]]:hidden" />
          <PiArrowCircleDownFill className="hidden text-red-700 group-[[data-active=true]]:block" />
      </button>

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
                name="postId"
                value={postId}
              />

              <Dialog.Title className="text-center font-bold">
                Tell us more about why you&rsquo;re
                <br />
                downvoting this post:
              </Dialog.Title>

              <fieldset className="flex flex-col gap-2 text-sm">
                <button
                  className="w-full rounded-sm border-b-2 border-gray-200 bg-gray-50 px-3 py-1.5 text-left ring ring-gray-300 hover:mt-0.5 hover:border-b-0"
                  name="vote"
                  value="down.incorrect"
                  type="submit"
                >
                  It contains outdated or incorrect information.
                </button>

                <button
                  className="w-full rounded-sm border-b-2 border-gray-200 bg-gray-50 px-3 py-1.5 text-left ring ring-gray-300 hover:mt-0.5 hover:border-b-0"
                  name="vote"
                  value="down.harmful"
                  type="submit"
                >
                  It contains harmful or offensive content.
                </button>

                <button
                  className="w-full rounded-sm border-b-2 border-gray-200 bg-gray-50 px-3 py-1.5 text-left ring ring-gray-300 hover:mt-0.5 hover:border-b-0"
                  name="vote"
                  type="submit"
                  value="down.spam"
                >
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

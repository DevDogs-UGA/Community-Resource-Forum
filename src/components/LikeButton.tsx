"use client";

import { useActionState, useMemo } from "react";
import { PiHeartBold, PiHeartFill } from "react-icons/pi";
import like from "~/server/actions/like";

interface Props {
  postId: string;
  likeCount: number;
  likeStatus: boolean;
}

export default function LikeButton({ postId, ...defaultState }: Props) {
  const [state, formAction, pending] = useActionState(like, defaultState);

  const optimisticState = useMemo(
    () => ({
      likeCount: pending
        ? !state.likeStatus
          ? state.likeCount + 1
          : state.likeCount - 1
        : state.likeCount,
      likeStatus: pending ? !state.likeStatus : state.likeStatus,
    }),
    [state, pending],
  );

  return (
    <form action={formAction} className="contents">
      <input className="hidden" type="hidden" name="postId" value={postId} />

      <button
        className="group flex items-center gap-2 rounded-sm px-2 py-1 leading-none hover:bg-rose-100"
        data-active={optimisticState.likeStatus}
        type="submit"
      >
        <span className="group-hover:text-rose-700 group-[[data-active=true]]:text-rose-700">
          <PiHeartBold className="group-[[data-active=true]]:hidden" />
          <PiHeartFill className="hidden text-rose-700 group-[[data-active=true]]:block" />
        </span>
        <span className="text-xs font-semibold">
          {/* TODO: Add large integer formatting using `Intl.NumberFormat` */}
          {optimisticState.likeCount}
        </span>
      </button>
    </form>
  );
}

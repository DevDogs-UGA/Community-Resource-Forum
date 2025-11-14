"use client";
import { useState } from "react";

interface KeepPostProps {
  postId: string;
  userId: string;
}
export default function KeepPost({ postId, userId }: KeepPostProps) {
  const [kept, setKept] = useState(false);
  const handleKeep = async () => {
    if (kept) return;

    const res = await fetch(`/api/removeFlag/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, postId }),
    });

    if (res.ok) {
      setKept(true);
    }
  };

  return (
    <button
      onClick={handleKeep}
      disabled={kept}
      className={`rounded px-3 py-1 ${kept ? "cursor-not-allowed bg-gray-300" : "bg-green-500 text-white hover:bg-green-600"}`}
    >
      {kept ? "Post Kept" : "Keep Post"}
    </button>
  );
}

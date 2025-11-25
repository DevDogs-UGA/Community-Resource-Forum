"use client";

import { useState } from "react";

import { PiFlagBold, PiFlagFill } from "react-icons/pi";

interface FlagButtonProps {
  postId: string;
  userId: string;
  [key: string]: string | boolean;
}
export default function FlagButton({
  postId,
  userId,
  ...props
}: FlagButtonProps) {
  const [flagged, setFlagged] = useState(false);

  const handleFlag = async () => {
    if (!userId) {
      alert("You must be logged in to flag posts.");
      return;
    }

    try {
      const res = await fetch("/api/flags", {
        method: flagged ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, postId }),
      });

      if (res.ok) {
        setFlagged(!flagged);
      } else {
        const text = await res.text();
        console.error("Flag API error:", text);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  return (
    <button
      onClick={handleFlag}
      className={`cursor-pointer text-sm font-medium ${
        flagged ? "text-amber-500" : "text-gray-500"
      }`}
      {...props}
    >
      {flagged ? (
        <PiFlagFill className="text-lg" />
      ) : (
        <PiFlagBold className="text-lg" />
      )}
    </button>
  );
}

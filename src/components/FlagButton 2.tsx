"use client";

import { useState } from "react";

interface FlagButtonProps {
  postId: string;
  userId: string;
}
export default function FlagButton({ postId, userId }: FlagButtonProps) {
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
      className={`text-sm font-medium ${
        flagged ? "text-red-600" : "text-gray-500"
      }`}
    >
      {flagged ? "Flagged" : "🚩"}
    </button>
  );
}

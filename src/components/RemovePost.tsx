"use client";

import { useState } from "react";

{
  /* rest of the code should have a remove post logic where the post is removed if readonly is true and the button is clicked */
}
{
  /* if the button is clicked, then it should called the remove post api to remove the post */
}

interface RemovePostProps {
  postId: string;
  userId: string;
}

export default function RemovePost({ postId, userId }: RemovePostProps) {
  const [removed, setRemoved] = useState(false);

  const handleRemove = async () => {
    if (removed) return;

    const res = await fetch(`/api/posts/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, postId }),
    });

    if (res.ok) {
      setRemoved(true);
    }
  };

  return (
    <button onClick={handleRemove} disabled={removed} className={`px-3 py-1 rounded ${removed ? "bg-gray-300 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}>
      {removed ? "Post Removed" : "Remove Post"}
    </button>
  );
}

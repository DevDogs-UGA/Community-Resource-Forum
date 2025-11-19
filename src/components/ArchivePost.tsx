"use client";
import { useState } from "react";
{
  /* rest of the code should have a remove post logic where the post is removed if readonly is true and the button is clicked */
}
{
  /* if the button is clicked, then it should called the remove post api to remove the post */
}
interface ArchivePostProps {
  postId: string;
  userId: string;
}
export default function ArchivePost({ postId, userId }: ArchivePostProps) {
  const [archived, setArchived] = useState(false);
  const handleArchive = async () => {
    if (archived) return;

    const res = await fetch(`/api/posts/`, {
      method: "PATCH", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, postId }),
    });

    if (res.ok) {
      setArchived(true);
    }
  };

  return (
    <button
      onClick={handleArchive}
      disabled={archived}
      className={`rounded px-3 py-1 ${archived ? "cursor-not-allowed bg-gray-300" : "bg-yellow-500 text-white hover:bg-yellow-600"}`}
    >
      {archived ? "Post Archived" : "Archive Post"}
    </button>
  );
}
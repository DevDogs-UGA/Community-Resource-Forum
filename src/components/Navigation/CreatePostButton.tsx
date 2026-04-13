"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { useCallback } from "react";
import { PiPlus } from "react-icons/pi";
import { useCreatePost } from "~/components/CreatePost/CreatePostContext";

export default function CreatePostButton() {
  const createPost = useCreatePost();

  const handleSelect = useCallback(() => {
    createPost();
  }, [createPost]);

  return (
    <Dropdown.Item onSelect={handleSelect}>
      <button className="flex w-full items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200">
        <PiPlus />
        New Post
      </button>
    </Dropdown.Item>
  );
}

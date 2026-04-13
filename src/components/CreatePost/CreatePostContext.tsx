"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import type SelectProfile from "../SelectProfile";
import type ContentEditor from "./CreatePostDialog/ContentEditor";
import type SelectAttachments from "./CreatePostDialog/SelectAttachments";
import type SelectEvent from "./CreatePostDialog/SelectEvent";
import type SelectTags from "./CreatePostDialog/SelectTags";

interface DefaultValue {
  authorId?: ComponentProps<typeof SelectProfile>["defaultValue"];
  tags?: ComponentProps<typeof SelectTags>["defaultValue"];
  content?: ComponentProps<typeof ContentEditor>["defaultValue"];
  attachments?: ComponentProps<typeof SelectAttachments>["defaultValue"];
  event?: ComponentProps<typeof SelectEvent>["defaultValue"];
}

interface PostContext {
  defaultValue: DefaultValue | undefined;
  setDefaultValue: Dispatch<SetStateAction<PostContext["defaultValue"]>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<PostContext["open"]>>;
}

const PostContext = createContext<PostContext | null>(null);

export function Provider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [defaultValue, setDefaultValue] =
    useState<PostContext["defaultValue"]>();

  return (
    <PostContext value={{ open, setOpen, defaultValue, setDefaultValue }}>
      {children}
    </PostContext>
  );
}

export function useCreatePostContext() {
  const context = useContext(PostContext);

  if (!context) {
    throw new Error(
      "Any component with `useCreatePost()` must be a descendant of <CreatePostProvider />.",
    );
  }

  return context;
}

export function useCreatePost() {
  const context = useCreatePostContext();

  return useCallback(
    (defaultValue?: PostContext["defaultValue"]) => {
      context.setDefaultValue(defaultValue);
      context.setOpen(true);
    },
    [context],
  );
}

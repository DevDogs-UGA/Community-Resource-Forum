"use client";

import {
  createContext,
  use,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { tags as tagsTable } from "~/server/db/schema/tables";
import { isAncestor, reduceTags, type Tag } from "../lib/tags";

const TagsContext = createContext<Promise<
  (typeof tagsTable.$inferSelect)[]
> | null>(null);

interface TagsProviderProps extends PropsWithChildren {
  value: Promise<(typeof tagsTable.$inferSelect)[]>;
}

export function TagsProvider({ children, value }: TagsProviderProps) {
  return <TagsContext value={value}>{children}</TagsContext>;
}

interface Selected {
  tag: Tag;
  deselect: () => void;
}

interface Queried {
  tag: Tag;
  disabled: boolean;
  select: () => void;
}

/**
 *
 * @param tags
 * @returns
 */
export default function useTagSelector(defaultValue?: string[]) {
  const context = useContext(TagsContext);

  if (!context) {
    throw new Error(
      "Any component with `useTagSelector()` must be a descendant of <TagsProvider />.",
    );
  }

  const tags = use(context);
  const sortedTags = useMemo(
    () => tags.toSorted((a, b) => a.lft - b.lft),
    [tags],
  );

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Tag[]>(
    () =>
      defaultValue
        ?.map((id) => tags.find((tag) => tag.id === id))
        .filter((t) => t !== undefined) ?? [],
  );

  const deselect = useCallback((tag: Tag) => {
    setSelected((s) => s.filter((other) => tag.id !== other.id));
  }, []);

  const select = useCallback((tag: Tag) => {
    setSelected((s) => [...s, tag]);
    setQuery("");
  }, []);

  const reset = useCallback(() => {
    setSelected([]);
    setQuery("");
  }, []);

  const reducedSelection = useMemo<Selected[]>(
    () =>
      reduceTags(selected).map((tag) => ({
        tag,
        deselect: () => {
          deselect(tag);
        },
      })),
    [selected, deselect],
  );

  const queried = useMemo(
    () =>
      sortedTags.filter(
        (tag) =>
          !reducedSelection.some(
            (result) => result.tag.id === tag.id || isAncestor(result.tag, tag),
          ) && tag.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, reducedSelection, sortedTags],
  );

  const visibleTags = useMemo<Queried[]>(
    () =>
      sortedTags
        .filter((tag) =>
          queried.some(
            (result) => tag.lft <= result.lft && result.rgt <= tag.rgt,
          ),
        )
        .map((tag) => ({
          tag,
          disabled: selected.some(
            (selection) =>
              selection.id === tag.id || isAncestor(selection, tag),
          ),
          select: () => select(tag),
        })),
    [queried, select, selected, sortedTags],
  );

  return {
    query,
    setQuery,
    selected: reducedSelection,
    queried: visibleTags,
    reset,
  };
}

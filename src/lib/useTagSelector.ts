import { useCallback, useEffect, useMemo, useState } from "react";
import type { tags as tagsTable } from "~/server/db/schema";

type Tag = typeof tagsTable.$inferSelect;

interface Tree {
  tag: Tag;
  children: Tree[];
}

const prefixOrdering = (a: Tree, b: Tree) => a.tag.lft - b.tag.lft;
const postfixOrdering = (a: Tag, b: Tag) => a.rgt - b.rgt;

function retree(tags: Tag[]) {
  const nodes: Tree[] = tags
    .toSorted(postfixOrdering)
    .map((tag) => ({ tag, children: [] }));
  const tree: Tree[] = [];

  function retreeSubarray(start: number) {
    const childrenStart = tree.push(nodes[start]!) - 1;
    let i = start + 1;

    while (i < nodes.length) {
      if (nodes[i]!.tag.depth > tree[childrenStart]!.tag.depth) {
        i = retreeSubarray(i);
        continue;
      }

      if (nodes[i]!.tag.depth < tree[childrenStart]!.tag.depth) {
        nodes[i]!.children = tree.splice(
          childrenStart,
          tree.length - childrenStart,
          nodes[i]!,
        );
        i++;
        continue;
      }

      tree.push(nodes[i]!);
      i++;
    }

    return nodes.length;
  }

  retreeSubarray(0);
  nodes.sort(prefixOrdering);

  return { tree, nodes };
}

interface Selected {
  tag: Tag;
  deselect: () => void;
}

function reduceSelection(tree: Tree[], selected: string[]) {
  const selection: Tag[] = [];

  for (const node of tree) {
    if (
      selected.includes(node.tag.id) ||
      (node.children.length > 1 &&
        node.children.every((child) => selected.includes(child.tag.id)))
    ) {
      selection.push(node.tag);
    } else {
      selection.push(...reduceSelection(node.children, selected));
    }
  }

  return selection;
}

interface Queried {
  tag: Tag;
  disabled: boolean;
  select: () => void;
}

export default function useTagSelector(tags: Tag[]) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { tree, nodes } = useMemo(() => retree(tags), [tags]);

  const deselect = useCallback((id: string) => {
    setSelected((s) => s.filter((other) => id !== other));
  }, []);

  const select = useCallback((id: string) => {
    setSelected((s) => [...s, id]);
    setQuery("");
  }, []);

  const reset = useCallback(() => {
    setSelected([]);
    setQuery("");
  }, []);

  const reducedSelection = useMemo<Selected[]>(
    () =>
      reduceSelection(tree, selected).map((tag) => ({
        tag,
        deselect: () => deselect(tag.id),
      })),
    [tree, selected, deselect],
  );

  const queried = useMemo(
    () =>
      nodes.filter(
        (node) =>
          !reducedSelection.some(
            (result) =>
              node.tag.lft <= result.tag.lft && result.tag.rgt <= node.tag.rgt,
          ) && node.tag.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [nodes, query, reducedSelection],
  );

  const visibleTags = useMemo<Queried[]>(
    () =>
      nodes
        .filter((node) =>
          queried.some(
            (match) =>
              node.tag.lft <= match.tag.lft && match.tag.rgt <= node.tag.rgt,
          ),
        )
        .map((node) => ({
          tag: node.tag,
          disabled: selected.includes(node.tag.id),
          select: () => select(node.tag.id),
        })),
    [nodes, queried, select, selected],
  );

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  // return {
  //   query,
  //   setQuery,
  //   queried,
  //   selected: reducedSelected,
  // } satisfies State;
  return {
    query,
    setQuery,
    selected: reducedSelection,
    queried: visibleTags,
    reset,
  };
}

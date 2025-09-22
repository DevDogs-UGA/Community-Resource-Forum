import { db } from "~/db";
import tagsObject from "./tags.json";
import { tags as tagsTable } from "~/db/schema";

interface Tree {
  [key: string]: Tree;
}

async function addTags(tags: Tree, parentId?: string) {
  const keys = Object.keys(tags);

  if (keys.length <= 0) {
    return;
  }

  await db
    .insert(tagsTable)
    .values(keys.map((key) => ({ parentId, name: key })))
    .$returningId()
    .then((ids) =>
      Promise.all(ids.map(({ id }, i) => addTags(tags[keys[i]!]!, id))),
    );
}

export async function POST() {
  await addTags(tagsObject);
  return Response.json({ success: true });
}

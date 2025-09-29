import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import { env } from "~/env";
import * as schema from "./schema";
import tags from "./tags.json";
import { sql } from "drizzle-orm";

interface Tree {
  [key: string]: Tree;
}

interface NestedSetItem {
  name: string;
  depth: number;
  lft: number;
  rgt: number;
}

function buildNestedSet(tags: Tree, offset = 0, depth = 0): NestedSetItem[] {
  const keys = Object.keys(tags);
  const result: NestedSetItem[] = [];

  for (const name of keys) {
    const lft = result.length > 0 ? result[result.length - 1]!.rgt + 1 : offset;
    const children = buildNestedSet(tags[name]!, lft + 1, depth + 1);

    result.push(...children, {
      name,
      depth,
      lft,
      rgt: lft + children.length * 2 + 1,
    });
  }

  return result;
}

async function getDB() {
  const globalForDb = globalThis as unknown as {
    conn: Pool | undefined;
  };

  const conn =
    globalForDb.conn ??
    createPool({
      host: env.MYSQL_HOST,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      port: env.MYSQL_PORT,
      database: env.MYSQL_DATABASE,
    });

  const db = drizzle(conn, { schema, mode: "default" });

  if (env.NODE_ENV === "production") {
    return db;
  }

  if (!globalForDb.conn) {
    await db
      .insert(schema.tags)
      .values(buildNestedSet(tags))
      .onDuplicateKeyUpdate({
        set: {
          id: sql`id`,
          name: sql`name`,
          lft: sql`values(${schema.tags.lft})`,
          rgt: sql`values(${schema.tags.rgt})`,
          depth: sql`values(${schema.tags.depth})`,
        },
      })
      .catch(() => {
        console.warn("Database already seeded.");
      });
  }

  globalForDb.conn = conn;
  return db;
}

export const db = await getDB();

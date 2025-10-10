import { sql } from "drizzle-orm";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";

export function lower(email: AnyMySqlColumn) {
  return sql`(lower(${email}))`;
}

export function increment(col: AnyMySqlColumn, delta = 1) {
  return sql`(${col} + ${delta})`;
}

import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import {
  type Column,
  type ColumnBaseConfig,
  entityKind,
  type SQL,
  sql,
  type SQLChunk,
  type SQLWrapper,
} from "drizzle-orm";

type AnyTextColumn = Column<ColumnBaseConfig<"string", string>>;
type AgainstSearchModifier =
  | "natural"
  | "boolean"
  | "natural with exp"
  | "with exp";
type MatchAgainstConfig = {
  /**
   * natural --> IN NATURAL LANGUAGE MODE
   * boolean --> IN BOOLEAN MODE
   * natural with exp --> IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION
   * with exp --> WITH QUERY EXPANSION
   */
  mode: AgainstSearchModifier;
};

const matchModeMap: Record<AgainstSearchModifier, string> = {
  natural: "IN NATURAL LANGUAGE MODE",
  boolean: "IN BOOLEAN MODE",
  "natural with exp": "IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION",
  "with exp": "WITH QUERY EXPANSION",
};

export class MatchAgainst {
  static readonly [entityKind]: string = "MatchFunction";

  constructor(private columns: AnyTextColumn[]) {}

  against(value: string | SQLWrapper, config?: MatchAgainstConfig): SQL {
    const chunks: SQLChunk[] = [sql`match(`];

    for (const column of this.columns.slice(0, -1)) {
      chunks.push(column, sql`, `);
    }

    chunks.push(this.columns.at(-1), sql`) against (${value}`);

    if (config) {
      chunks.push(sql.raw(` ${matchModeMap[config.mode]}`));
    }
    chunks.push(sql`)`);

    return sql.join(chunks);
  }
}

/**
 * Creates a `match` fulltext search function that can be used in a WHERE clause.
 * The match function must be followed by the `.against` clause.
 * This will perform a fulltext search on the specified column(s).
 * The search can include wildcards.
 *
 * ## Examples
 *
 * ```ts
 * // Select all cars that include the letters 'abc' anywhere in their tag.
 * db.select().from(cars)
 *   .where(match(cars.tag).against('%abc%'))
 * ```
 */
export function match(
  ...columns: [AnyTextColumn, ...AnyTextColumn[]]
): MatchAgainst {
  return new MatchAgainst(columns);
}

export function lower(email: AnyMySqlColumn) {
  return sql`(lower(${email}))`;
}

export function increment(col: AnyMySqlColumn, delta = 1) {
  return sql`(${col} + ${delta})`;
}

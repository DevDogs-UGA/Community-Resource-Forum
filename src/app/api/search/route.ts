import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../server/db";
import { posts } from "../../../server/db/schema";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ searchterms: string }> },
): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const term = params.get("query");
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo"); //yyyy-mm-dd
  const commentCountParam = params.get("commentCount");
  const flag = params.get("flag");
  const sortBy = params.get("sortBy");

  if (!term) {
    return NextResponse.json(
      { error: request, message: "Search term is required" },
      { status: 400 },
    );
  }

  try {
    const results = await db
      .select()
      .from(posts)
      .where(sql`MATCH(${posts.content}) AGAINST(${term})`);

    let filtered = results;

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) {
        filtered = filtered.filter((p) => new Date(p.createdAt) >= from);
      }
    }

    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to.getTime())) {
        filtered = filtered.filter((p) => new Date(p.createdAt) <= to);
      }
    }

    if (commentCountParam) {
      const min = Number(commentCountParam);
      if (!Number.isNaN(min)) {
        filtered = filtered.filter((p) => (p.commentCount ?? 0) >= min);
      }
    }

    if (flag !== null) {
      const f = String(flag).trim();
      if (f.length > 0) {
        filtered = filtered.filter((p) => {
          const flagsField = (p as any).flags ?? "";
          return String(flagsField).includes(f);
        });
      }
    }

    return NextResponse.json({ results: filtered });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

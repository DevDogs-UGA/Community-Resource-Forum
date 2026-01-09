import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { posts } from "../../../../server/db/schema";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ searchterms: string }> },
): Promise<NextResponse> {
  const { searchterms: term } = await context.params;

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

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

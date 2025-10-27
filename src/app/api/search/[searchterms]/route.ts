import { NextResponse } from "next/server";
import { db} from "../../../../server/db";
import { posts } from "../../../../server/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: { searchterms: string } }) {
  const term = params.searchterms;

  if (!term) {
    return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
  }

  try {
    const results = await db
      .select()
      .from(posts)
      .where(sql`MATCH(${posts.content}) AGAINST(${term} IN NATURAL LANGUAGE MODE)`);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
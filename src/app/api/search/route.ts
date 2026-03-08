import { NextResponse } from "next/server";
import { db } from "../../../server/db";
import { posts } from "../../../server/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const search = params.get("search") ?? params.get("searchterms") ?? "";
  const startDateRaw = params.get("startDate");
  const startDate = startDateRaw ? new Date(startDateRaw) : undefined;
  const endDateRaw = params.get("endDate");
  const endDate = endDateRaw ? new Date(endDateRaw) : undefined;
  const flaggedRaw = params.get("flagged");
  const flagged = flaggedRaw !== null ? parseInt(flaggedRaw, 10) : undefined;
  const archivedRaw = params.get("archived");
  const archived = archivedRaw;
  const minCommentsRaw = params.get("minComments");
  const minComments =
    minCommentsRaw !== null ? parseInt(minCommentsRaw, 10) : undefined;

  const parsed = { search, startDate, endDate, flagged, archived, minComments };

  try {
    const results = await db
      .select()
      .from(posts)
      .where(sql`MATCH(${posts.content}) AGAINST(${search})`);

    // Apply in-memory filters based on parsed search params (no DB-side changes)
    const filtered = (results ?? []).filter((row: any) => {
      // archived: expect integer (e.g., 0 or 1)
      if (typeof archived === "number" && !Number.isNaN(archived)) {
        if (row.archived !== archived) return false;
      }

      // minComments: filter by commentCount >= minComments
      if (typeof minComments === "number" && !Number.isNaN(minComments)) {
        if ((row.commentCount ?? 0) < minComments) return false;
      }

      // flagged: treat as minimum flagCount threshold
      if (typeof flagged === "number" && !Number.isNaN(flagged)) {
        if (!((row.flagCount ?? 0) && flagged)) return false;
      }

      // date range: compare against createdAt
      const updated = row.createdAt ? new Date(row.createdAt) : null;
      if (startDate && updated) {
        if (updated.getTime() < startDate.getTime()) return false;
      }
      if (endDate && updated) {
        if (updated.getTime() > endDate.getTime()) return false;
      }
      return true;
    });

    return NextResponse.json({
      results: filtered,
      parsed: {
        search,
        startDate: startDateRaw ?? null,
        endDate: endDateRaw ?? null,
        flagged,
        archived,
        minComments,
      },
    });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

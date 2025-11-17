import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    const calendarEvents = await db.query.events.findMany({
      with: {
        profile: true,
      },
    });

    // Transform database events to FullCalendar format
    const formattedEvents = calendarEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      location: event.location,
      extendedProps: {
        organizerId: event.organizerId,
        organizer: event.profile,
        tags: event.tags,
      },
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 },
    );
  }
}

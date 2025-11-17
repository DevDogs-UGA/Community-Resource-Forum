import { db } from "~/server/db";
import { and, gte, lt } from "drizzle-orm";
import { events } from "~/server/db/schema";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string | null;
  extendedProps: {
    organizerId: string;
    organizer: {
      id: string;
      type: "user" | "organization";
      name: string;
      bio: string | null;
      linkedin: string | null;
      github: string | null;
      personalSite: string | null;
      image: string | null;
      createdAt: Date;
      updatedAt: Date | null;
    };
    tags: unknown;
  };
}

export async function getCalendarEvents(month?: string): Promise<CalendarEvent[]> {
  try {
    // Parse month (format: YYYY-MM) or default to current month
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, monthNum] = targetMonth.split("-").map(Number);

    // Calculate start and end of the month
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1); // First day of next month

    const calendarEvents = await db.query.events.findMany({
      where: and(gte(events.start, monthStart), lt(events.start, monthEnd)),
      with: {
        profile: true,
      },
    });

    // Transform database events to FullCalendar format
    const formattedEvents = calendarEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      allDay: event.allDay,
      location: event.location,
      extendedProps: {
        organizerId: event.organizerId,
        organizer: event.profile,
        tags: event.tags,
      },
    }));

    return formattedEvents;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error("Failed to fetch calendar events");
  }
}

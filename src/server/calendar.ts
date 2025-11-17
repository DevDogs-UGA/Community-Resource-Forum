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
    isMultiDay: boolean;
  };
}

export async function getCalendarEvents(
  month?: string,
): Promise<CalendarEvent[]> {
  try {
    // Parse month (format: YYYY-MM) or default to current month
    const now = new Date();
    const targetMonth =
      month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const parts = targetMonth.split("-");
    const year = parseInt(parts[0] || "0", 10);
    const monthNum = parseInt(parts[1] || "1", 10);

    // Calculate start and end of the month
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1); // First day of next month

    // Query for events that either start in this month OR span into this month
    // This ensures multi-day events display across all days they cover
    const calendarEvents = await db.query.events.findMany({
      where: and(
        lt(events.start, monthEnd), // Event starts before month ends
        gte(events.end, monthStart), // Event ends after month starts
      ),
      with: {
        profile: true,
      },
    });

    // Transform database events to FullCalendar format
    const formattedEvents = calendarEvents.map((event) => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      // Check if event spans multiple days (ends on different day than it starts)
      const isMultiDay = startDate.toDateString() !== endDate.toDateString();

      // For all-day multi-day events, adjust end date to be exclusive (next day)
      let finalEnd = event.end.toISOString();
      if (event.allDay && isMultiDay) {
        // Make sure end date is set to the day after the last day (exclusive)
        const adjustedEnd = new Date(endDate);
        adjustedEnd.setDate(adjustedEnd.getDate() + 1);
        adjustedEnd.setHours(0, 0, 0, 0);
        finalEnd = adjustedEnd.toISOString();
      }

      return {
        id: event.id,
        title: event.title,
        start: event.start.toISOString(),
        end: finalEnd,
        allDay: event.allDay,
        location: event.location,
        extendedProps: {
          organizerId: event.organizerId,
          organizer: event.profile,
          tags: event.tags,
          isMultiDay,
        },
      };
    });

    return formattedEvents;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error("Failed to fetch calendar events");
  }
}

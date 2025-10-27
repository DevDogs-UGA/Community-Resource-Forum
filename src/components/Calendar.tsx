"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
//import type { InferSelectModel } from "drizzle-orm";
//import { profiles } from "~/server/db/schema";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "~/styles/calendar.css";
import { useEffect, useState } from "react";
import EventTooltip from "./EventTooltip";
import { downloadICS } from "~/lib/generateICS";

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
      name: string | null;
      email: string | null;
      image: string | null;
    };
  };
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/calendar");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
        console.error("Error fetching events:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="h-screen p-4">
      {error ? (
        <div className="flex h-screen items-center justify-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          nowIndicator={true}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          eventContent={(eventInfo) => (
            <Tippy
              content={<EventTooltip event={eventInfo} />}
              placement="auto"
              interactive={true}
              animation="fade"
              duration={200}
              zIndex={9999}
              appendTo={() => document.body}
            >
              <div
                onClick={() => {
                  const event = {
                    id: eventInfo.event.id,
                    title: eventInfo.event.title,
                    start: new Date(eventInfo.event.start!),
                    end: new Date(eventInfo.event.end!),
                    allDay: eventInfo.event.allDay,
                    location: eventInfo.event.extendedProps.location,
                    organizerId: eventInfo.event.extendedProps.organizerId,
                  };
                  downloadICS(event);
                }}
                className="flex cursor-pointer flex-col gap-0.5 rounded-sm border-l-[3px] border-l-sky-500 bg-white/95 px-1.5 py-1 shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-md"
              >
                <div className="line-clamp-1 text-sm font-medium text-gray-900">
                  {eventInfo.event.title}
                </div>
                {eventInfo.event.extendedProps.location && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-600">
                    <svg
                      className="h-2.5 w-2.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C7.58172 2 4 5.58172 4 10C4 14.0797 7.04334 17.0881 10.7317 17.8V21H13.2683V17.8C16.9567 17.0881 20 14.0797 20 10C20 5.58172 16.4183 2 12 2ZM12 15C9.23858 15 7 12.7614 7 10C7 7.23858 9.23858 5 12 5C14.7614 5 17 7.23858 17 10C17 12.7614 14.7614 15 12 15Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="truncate">
                      {eventInfo.event.extendedProps.location}
                    </span>
                  </div>
                )}
              </div>
            </Tippy>
          )}
          height="100%"
        />
      )}
    </div>
  );
}

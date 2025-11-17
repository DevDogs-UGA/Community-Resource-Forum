"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { DatesSetArg } from "@fullcalendar/core";
import * as Tooltip from "@radix-ui/react-tooltip";
import "~/styles/calendar.css";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      image: string | null;
    };
    tags: unknown;
    isMultiDay: boolean;
  };
}

interface CalendarProps {
  events: CalendarEvent[];
  currentMonth?: string;
}

export default function Calendar({ events, currentMonth }: CalendarProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDatesSet = useCallback(
    (info: DatesSetArg) => {
      // Extract the year and month from the calendar view
      const date = info.view.currentStart;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const newMonth = `${year}-${month}`;

      // Only update if the month has actually changed
      if (newMonth !== currentMonth) {
        // Push a new URL with the month search param; server will refetch on navigation
        void router.push(`?month=${newMonth}`);
      }
    },
    [currentMonth, router],
  );

  return (
    <div className="calendar-container h-screen p-4 md:p-6 lg:p-8">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        initialDate={currentMonth ? `${currentMonth}-01` : undefined}
        events={events}
        datesSet={handleDatesSet}
        eventDisplay="block"
        dayMaxEventRows={false}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        nowIndicator={true}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        eventContent={(eventInfo) => (
          <Tooltip.Provider delayDuration={0}>
            <Tooltip.Root
              open={
                isMobile && openTooltipId === eventInfo.event.id
                  ? true
                  : undefined
              }
              onOpenChange={(open) => {
                if (isMobile) {
                  setOpenTooltipId(open ? eventInfo.event.id : null);
                }
              }}
            >
              <Tooltip.Trigger asChild>
                <div
                  onClick={() => {
                    if (isMobile) {
                      // On mobile, toggle tooltip visibility
                      setOpenTooltipId(
                        openTooltipId === eventInfo.event.id
                          ? null
                          : eventInfo.event.id,
                      );
                    } else {
                      // On desktop, download ICS file
                      const event = {
                        id: eventInfo.event.id,
                        title: eventInfo.event.title,
                        start: new Date(eventInfo.event.start!),
                        end: new Date(eventInfo.event.end!),
                        allDay: eventInfo.event.allDay,
                        location: eventInfo.event.extendedProps.location as
                          | string
                          | null,
                        organizerId: eventInfo.event.extendedProps
                          .organizerId as string,
                        tags: eventInfo.event.extendedProps.tags as unknown,
                      };
                      downloadICS(event);
                    }
                  }}
                  onMouseEnter={() => setHoveredEventId(eventInfo.event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  className={`event-card flex w-full cursor-pointer flex-col gap-0.5 overflow-hidden rounded-sm border-l-[3px] border-l-sky-500 bg-white/95 px-1.5 py-1 shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-md ${
                    hoveredEventId === eventInfo.event.id &&
                    !eventInfo.event.extendedProps.isMultiDay
                      ? "md:mr-auto md:ml-auto md:w-screen md:max-w-4xl"
                      : ""
                  }`}
                >
                  <div
                    className={`event-title text-sm font-medium text-gray-900 transition-all ${
                      hoveredEventId === eventInfo.event.id &&
                      !eventInfo.event.extendedProps.isMultiDay
                        ? "whitespace-normal"
                        : "line-clamp-1"
                    }`}
                  >
                    {eventInfo.event.title}
                  </div>
                  {eventInfo.event.extendedProps.location && (
                    <div className="event-location flex items-center gap-1 text-[10px] text-gray-600">
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
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Content side="top" sideOffset={6} className="z-50">
                  <EventTooltip event={eventInfo} />
                  <Tooltip.Arrow />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
        height="100%"
      />
    </div>
  );
}

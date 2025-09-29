import {
  isSameDay,
  formatDistanceToNow,
  isBefore,
  addYears,
  getYear,
  isSameMonth,
  format,
} from "date-fns";
import type { events } from "~/server/db/schema";

type Event = (typeof events)["$inferSelect"];

export default function formatEventTime(event: Event) {
  return isSameDay(event.start, event.end)
    ? event.allDay
      ? `${isSameDay(event.start, Date.now()) ? "Today" : formatDistanceToNow(event.start)} (${format(event.start, "EEE, MMM. d") + (isBefore(event.end, addYears(Date.now(), 1)) ? ", " + getYear(event.end) : "")})`
      : format(event.start, "h:mm") +
        format(event.end, "\u200B-h:mm aa, EEE, MMM. d") +
        (isBefore(event.end, addYears(Date.now(), 1))
          ? ", " + getYear(event.end)
          : "")
    : event.allDay
      ? isSameMonth(event.start, event.end)
        ? format(event.start, "EEE, MMM. ") +
          format(event.end, "\u200B-d") +
          (isBefore(event.end, addYears(Date.now(), 1))
            ? ", " + getYear(event.end)
            : "")
        : format(event.start, "EEE, MMM. d") +
          format(event.end, " \u200B- EEE, MMM. d") +
          (isBefore(event.end, addYears(Date.now(), 1))
            ? ", " + getYear(event.end)
            : "")
      : isSameMonth(event.start, event.end)
        ? format(event.start, "h:mm EEE, MMM. ") +
          format(event.end, " \u200B- h:mm MMM. d") +
          (isBefore(event.end, addYears(Date.now(), 1))
            ? ", " + getYear(event.end)
            : "")
        : format(event.start, "h:mm EEE, MMM. d") +
          format(event.end, " \u200B- h:mm EEE, MMM. d") +
          (isBefore(event.end, addYears(Date.now(), 1))
            ? ", " + getYear(event.end)
            : "");
}

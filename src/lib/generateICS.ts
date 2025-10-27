import type { events } from "~/server/db/schema";
type Event = (typeof events)["$inferSelect"];

export function generateICS(event: Event) {
  // Format date to ICS format (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  // Generate unique identifier
  const uid = `${event.id}@community-resource-forum`;
  const now = formatDate(new Date());
  const startDate = formatDate(event.start);
  const endDate = formatDate(event.end);

  // Build ICS content
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Community Resource Forum//Calendar Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return icsContent;
}

export function downloadICS(event: Event) {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

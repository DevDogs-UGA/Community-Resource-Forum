import { getCalendarEvents } from "~/server/calendar";
import Calendar from "~/components/Calendar";

export default async function Page({ searchParams }: { searchParams?: { month?: string } }) {
  // Determine target month from search params or default to current month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = (searchParams && searchParams.month) || defaultMonth;

  // Fetch events server-side for the requested month
  const events = await getCalendarEvents(month);

  return (
    <main className="min-h-screen">
      <Calendar events={events} currentMonth={month} />
    </main>
  );
}

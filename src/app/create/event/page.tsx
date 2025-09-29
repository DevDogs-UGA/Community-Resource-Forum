import { isBefore, parse } from "date-fns";
import { redirect } from "next/navigation";
import {
  PiClockCountdownBold,
  PiMapPinBold,
  PiPaperPlaneTiltBold,
  PiTextTBold,
  PiUsersBold,
} from "react-icons/pi";
import * as z from "zod";
import * as zfd from "zod-form-data";
import SelectDateTimeRange from "~/components/SelectDateTimeRange";
import SelectProfile from "~/components/SelectProfile";
import { getSessionUser } from "~/server/auth";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";

const schema = zfd.formData(
  z
    .object({
      organizerId: zfd.text(),
      title: zfd.text(),
      location: zfd.text(z.string().optional()),
      startDate: zfd
        .text()
        .transform((s) => parse(s, "yyyy-MM-dd", new Date()))
        .pipe(z.date()),
      endDate: zfd
        .text()
        .transform((s) => parse(s, "yyyy-MM-dd", new Date()))
        .pipe(z.date()),
    })
    .and(
      z.union([
        z.object({
          allDay: zfd.checkbox().pipe(z.literal(true)),
        }),
        z.object({
          allDay: zfd.checkbox().pipe(z.literal(false)),
          startTime: zfd.text(),
          endTime: zfd.text(),
        }),
      ]),
    ),
);

export default async function CreateEvent() {
  const session = await getSessionUser({
    with: {
      profile: {
        with: {
          events: true,
        },
      },
      organizations: {
        with: {
          organization: {
            with: {
              events: true,
            },
          },
        },
      },
    },
  });

  async function action(data: FormData) {
    "use server";

    if (session === null) {
      redirect("/");
    }

    const { organizerId, title, location, ...dateTime } =
      await schema.parseAsync(data);

    if (
      organizerId !== session.userId &&
      !session.user.organizations.some(
        (org) => org.organizationId === organizerId && org.role !== "member",
      )
    ) {
      redirect("/");
    }

    const start = !dateTime.allDay
      ? parse(dateTime.startTime, "HH:mm", dateTime.startDate)
      : dateTime.startDate;

    const end = !dateTime.allDay
      ? parse(dateTime.endTime, "HH:mm", dateTime.endDate)
      : dateTime.endDate;
      
    if (isBefore(Date.now(), start) || isBefore(end, start)) {
      console.error(
        "Start date must be before the current date and the end date.",
      );
      return;
    }

    await db
      .insert(events)
      .values({
        organizerId,
        title,
        location,
        start,
        end,
        allDay: dateTime.allDay,
      })
      .$returningId();

    redirect("/create/post");
  }

  if (session === null) {
    redirect("/sign-in");
  }

  const organizationProfiles = session.user.organizations
    .filter((rel) => rel.role === "officer" || rel.role === "owner")
    .map((rel) => rel.organization);

  return (
    <form
      action={action}
      className="mx-auto flex flex-col items-center gap-y-6 bg-gray-50 px-8 py-6 pb-24"
    >
      <h1 className="text-2xl font-bold">Create an Event</h1>

      <div className="flex w-full flex-col gap-2">
        <label className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
          <PiUsersBold className="-scale-x-100" /> Organizer
        </label>

        <div className="relative -mx-8 bg-gray-200 px-8 py-4">
          <SelectProfile
            inputName="organizerId"
            profiles={[session.user.profile, ...organizationProfiles]}
          />
        </div>
      </div>

      <label className="flex w-full flex-col gap-2">
        <span className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
          <PiClockCountdownBold /> Schedule
        </span>

        <span className="relative -mx-8 block bg-gray-200 px-8 py-4">
          <SelectDateTimeRange
            inputNames={{
              startDate: "startDate",
              startTime: "startTime",
              endDate: "endDate",
              endTime: "endTime",
              allDay: "allDay",
            }}
          />
        </span>
      </label>

      <label className="flex w-full flex-col gap-2">
        <span className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
          <PiTextTBold /> Title
        </span>

        <span className="relative -mx-8 block bg-gray-200 px-8 py-4">
          <span className="relative mx-auto block w-full max-w-xl">
            <input
              className="w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400"
              name="title"
              placeholder="My Awesome Event"
              type="text"
              required
            />
          </span>
        </span>
      </label>

      <label className="flex w-full flex-col gap-2">
        <span className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
          <PiMapPinBold /> Location
        </span>

        <span className="relative -mx-8 block bg-gray-200 px-8 py-4">
          <span className="relative mx-auto block w-full max-w-xl">
            <input
              className="w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400"
              name="location"
              placeholder="(optional)"
            />
          </span>
        </span>
      </label>

      <button
        className="flex items-center gap-3 rounded-sm border-b-2 border-sky-900 bg-sky-800 px-6 py-1 text-lg font-medium text-white shadow-sm ring-1 ring-sky-950 transition-colors hover:bg-sky-50 hover:text-sky-800 focus:mt-0.5 focus:border-b-0"
        type="submit"
      >
        <span className="contents">
          Publish <PiPaperPlaneTiltBold />
        </span>
      </button>
    </form>
  );
}

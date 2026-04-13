"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { getDate } from "date-fns";
import { useCallback, useId, useState, type ComponentProps } from "react";
import {
  PiArrowCounterClockwiseBold,
  PiCalendarBlank,
  PiCalendarBold,
  PiCheckBold,
  PiClockCountdownBold,
  PiMagnifyingGlass,
  PiMapPinBold,
  PiPlusBold,
  PiTextTBold,
  PiUsersBold,
  PiXBold,
} from "react-icons/pi";
import * as Combobox from "~/components/Combobox";
import formatEventTime from "~/lib/formatEventTime";
import type { events, profiles } from "~/server/db/schema/tables";
import SelectProfile from "~/components/SelectProfile";
import SelectDateTimeRange from "../../../SelectDateTimeRange";
import SelectTags from "../SelectTags";
import AttachmentBadge from "~/components/AttachmentBadge";

type Event = (typeof events)["$inferSelect"];
type Profile = (typeof profiles)["$inferSelect"];

type DefaultValue =
  | {
      id: string;
    }
  | ({
      organizerId?: string;
      title?: string;
      location?: string;
    } & ComponentProps<typeof SelectDateTimeRange>["defaultValue"]);

interface Props {
  events: Event[];
  userProfile: Profile;
  organizationProfiles: Profile[];
  defaultValue?: DefaultValue;
}

export default function SelectEvent({
  events,
  userProfile,
  organizationProfiles,
  defaultValue,
}: Props) {
  const [query, setQuery] = useState("");
  const id = useId();

  const [createNew, setCreateNew] = useState<boolean>(
    () => defaultValue !== undefined && !("id" in defaultValue),
  );

  const [value, setValue] = useState<Event | null>(
    () =>
      (defaultValue &&
        "id" in defaultValue &&
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        events.find((event) => event.id === defaultValue.id)) ||
      null,
  );

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(query.toLowerCase()),
  );

  const removeSelection = useCallback(() => {
    setValue(null);
  }, []);

  const updateSelection = useCallback((event: Event | null) => {
    if (event) {
      setValue(event);
      setQuery("");
    }
  }, []);

  return (
    <Collapsible.Root
      className="flex w-full flex-col gap-2"
      open={createNew}
      onOpenChange={setCreateNew}
    >
      <label className="flex items-center gap-2 font-bold" htmlFor={id}>
        <PiCalendarBold /> Include Event
      </label>

      {!createNew && value && (
        <div className="flex items-center gap-1.5">
          <input type="hidden" name="event.id" value={value.id} readOnly />
          <button
            type="button"
            className="aspect-square rounded-full p-1.5 text-sm text-red-900/70 transition-colors hover:bg-red-500/20 hover:text-red-800"
            onClick={removeSelection}
          >
            <PiXBold />
          </button>
          <AttachmentBadge event={value} preview />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Combobox.Root popover>
          <div className="relative grow">
            <Combobox.Input
              className="w-full rounded-sm bg-white py-1 pr-3 pl-10 ring ring-gray-400 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              id={id}
              disabled={createNew}
              placeholder="Search your events..."
            />

            <span
              className="group absolute inset-y-0 top-1/2 left-0 -translate-y-1/2 px-3"
              suppressHydrationWarning
            >
              <PiMagnifyingGlass className="size-4 fill-black/60 group-data-hover:fill-black" />
            </span>
          </div>

          <Combobox.Options className="group w-full origin-top transition-opacity perspective-distant data-[state=closed]:pointer-events-none! data-[state=closed]:opacity-0 data-[state=open]:pointer-events-auto!">
            <div className="bg-scroll-shadow max-h-65.5 w-full scroll-py-1 space-y-1 overflow-y-scroll rounded-sm border border-gray-600 p-1 shadow-xl transition-[transform,opacity,scale] transform-3d group-data-[state=closed]:scale-95 group-data-[state=closed]:-rotate-x-12">
              {filteredEvents.length <= 0 && (
                <p className="px-3 py-1 text-sm text-gray-500 italic">
                  No results found.
                </p>
              )}
              {filteredEvents.map((event) => (
                <Combobox.Option
                  key={event.id}
                  className="group flex cursor-default w-full items-center gap-2 rounded-sm px-3 py-1.5 select-none data-focus:bg-black/10"
                  onClick={() => updateSelection(event)}
                >
                  <div className="flex flex-1 items-center gap-3 py-0.5 text-xl text-black">
                    <span className="relative">
                      <PiCalendarBlank />
                      <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-px text-center text-[0.55rem] font-bold">
                        {getDate(event.start)}
                      </span>
                    </span>
                    <span className="flex flex-col gap-0.5 text-left">
                      <span className="text-sm/[1]">{event.title}</span>
                      <span className="text-[0.6rem]/[1] font-bold text-gray-600">
                        {formatEventTime(event)}
                      </span>
                    </span>
                  </div>
                  <PiCheckBold className="invisible size-4 fill-black group-data-selected:visible" />
                </Combobox.Option>
              ))}
            </div>
          </Combobox.Options>
        </Combobox.Root>

        <Collapsible.Trigger className="group flex items-center justify-center gap-2 rounded-md bg-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-900 ring ring-gray-400 transition-[box-shadow,background-color] hover:bg-gray-200 hover:shadow-md hover:ring-gray-500 data-[state=open]:bg-gray-100 data-[state=open]:shadow-xs data-[state=open]:hover:bg-gray-200 data-[state=open]:hover:shadow-md">
          <span className="hidden group-data-[state=open]:contents">
            <PiArrowCounterClockwiseBold />
            Use Existing
          </span>
          <span className="contents group-data-[state=open]:hidden">
            <PiPlusBold />
            Create New
          </span>
        </Collapsible.Trigger>
      </div>

      <Collapsible.Content className="data-[state=open]:animate-collapsible-open animate-collapsible-closed block overflow-hidden rounded-md border border-gray-400 bg-gray-100 shadow-xs transition-[height] data-[state=closed]:inset-shadow-sm">
        <div className="flex flex-col gap-7 px-5 pt-4 pb-7">
          <div className="flex w-full flex-col gap-2">
            <label className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiUsersBold className="-scale-x-100" /> Organizer
            </label>

            <SelectProfile
              inputName="event.organizerId"
              userProfile={userProfile}
              organizationProfiles={organizationProfiles}
              defaultValue={
                defaultValue && !("id" in defaultValue)
                  ? defaultValue.organizerId
                  : undefined
              }
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <label className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiClockCountdownBold /> Schedule
            </label>

            <SelectDateTimeRange
              inputNames={{
                startDay: "event.startDay",
                startTime: "event.startTime",
                endDay: "event.endDay",
                endTime: "event.endTime",
                allDay: "event.allDay",
                rruleSet: "event.rrule",
              }}
              defaultValue={
                defaultValue && !("id" in defaultValue)
                  ? defaultValue
                  : undefined
              }
            />
          </div>

          <label className="flex w-full flex-col gap-2">
            <span className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiTextTBold /> Title
            </span>

            <span className="relative mx-auto block w-full max-w-xl">
              <input
                className="w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400"
                name="event.title"
                placeholder="My Awesome Event"
                type="text"
                defaultValue={
                  defaultValue && !("id" in defaultValue)
                    ? defaultValue.title
                    : undefined
                }
                required
              />
            </span>
          </label>

          <SelectTags inputName="event.tags" />

          <label className="flex w-full flex-col gap-2">
            <span className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiMapPinBold /> Location
            </span>

            <span className="relative mx-auto block w-full max-w-xl">
              <input
                className="w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400"
                name="event.location"
                placeholder="(optional)"
                defaultValue={
                  defaultValue && !("id" in defaultValue)
                    ? defaultValue.location
                    : undefined
                }
              />
            </span>
          </label>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

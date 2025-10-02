"use client";

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { getDate } from "date-fns";
import { useCallback, useId, useState } from "react";
import {
  PiCalendarBlank,
  PiCheckBold,
  PiLinkBold,
  PiMagnifyingGlass
} from "react-icons/pi";
import formatEventTime from "~/lib/formatEventTime";
import type { events } from "~/server/db/schema";

type Event = (typeof events)["$inferSelect"];

interface Props {
  events: Event[];
}

export default function SelectEvent({ events }: Props) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<Event | null>(null);
  const id = useId();

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(query.toLowerCase()),
  );

  const updateSelection = useCallback((event: Event | null) => {
    if (event) {
      setValue(event);
      setQuery("");
    }
  }, []);

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold"
        htmlFor={id}
      >
        <PiLinkBold /> Attach an Event
      </label>

      <div className="relative -mx-8 bg-gray-200 px-8 py-4">
        <input type="hidden" name="eventId" value={value?.id ?? ""} readOnly />

        <Combobox
          immediate
          value={value}
          onChange={updateSelection}
          onClose={() => setQuery("")}
        >
          <div className="relative mx-auto w-full max-w-xl">
            <ComboboxInput
              className="w-full rounded-sm bg-white py-1 pr-3 pl-10 ring ring-gray-400"
              id="select-profile-combobox-input"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(p: Event | null) => p?.title ?? ""}
              placeholder="Search your events..."
            />

            <ComboboxButton className="group absolute inset-y-0 left-0 px-3">
              <PiMagnifyingGlass className="size-4 fill-black/60 group-data-hover:fill-black" />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor="bottom"
            transition
            className="z-50 w-(--input-width) rounded-sm border border-gray-600 bg-white p-1 shadow-xl transition duration-100 ease-in [--anchor-gap:--spacing(1)] empty:invisible data-leave:data-closed:opacity-0"
          >
            {filteredEvents.map((event) => (
              <ComboboxOption
                key={event.id}
                value={event}
                className="group flex cursor-default items-center gap-2 rounded-sm px-3 py-1.5 select-none data-focus:bg-black/10"
              >
                <div className="flex flex-1 items-center gap-3 py-0.5 text-xl text-black">
                  <span className="relative">
                    <PiCalendarBlank />
                    <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-px text-center text-[0.55rem] font-bold">
                      {getDate(event.start)}
                    </span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm/[1]">{event.title}</span>
                    <span className="text-[0.6rem]/[1] font-bold text-gray-600">
                      {formatEventTime(event)}
                    </span>
                  </span>
                </div>
                <PiCheckBold className="invisible size-4 fill-black group-data-selected:visible" />
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </div>
    </div>
  );
}

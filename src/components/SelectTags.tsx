"use client";

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useCallback, useId, useState } from "react";
import { PiCheckBold, PiHash, PiTagBold, PiXBold } from "react-icons/pi";
import type { tags as tagsTable } from "~/db/schema";

type Tag = (typeof tagsTable)["$inferSelect"];

interface Props {
  tags: Tag[];
}

export default function SelectTags({ tags }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Tag[]>([]);
  const id = useId();

  const filteredTags = tags.filter(
    (tag) =>
      !selected.includes(tag) &&
      tag.name.toLowerCase().includes(query.toLowerCase()),
  );

  const addSelection = useCallback((tag: Tag | null) => {
    if (tag) {
      setSelected((s) => [...s, tag]);
      setQuery("");
    }
  }, []);

  const removeSelection = useCallback((tag: Tag) => {
    setSelected((s) => s.filter((other) => other !== tag));
  }, []);

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="flex items-center gap-2 font-bold max-w-xl mx-auto w-full" htmlFor={id}>
        <PiTagBold className="-scale-x-100" /> Tags
      </label>

      <div className="relative -mx-8 bg-gray-200 px-8 py-4">
        <div className="flex flex-wrap gap-x-1.5 gap-y-1 not-empty:pb-2 text-sm max-w-xl mx-auto w-full">
          {selected.map((tag) => (
            <div
              key={tag.id}
              className="flex overflow-hidden rounded-sm border border-sky-800 shadow-xs"
            >
              <input type="hidden" name="tagId" value={tag.id} readOnly />
              <p className="line-clamp-1 flex-1 bg-sky-50 py-0.5 pr-6 pl-1.5 text-nowrap overflow-ellipsis">
                {tag.name}
              </p>
              <button
                type="button"
                className="bg-sky-800 px-1.5 py-0.5 text-white transition-colors hover:bg-sky-700"
                onClick={() => removeSelection(tag)}
              >
                <PiXBold />
              </button>
            </div>
          ))}
        </div>

        <Combobox
          immediate
          value={null as (Tag | null)}
          onChange={addSelection}
          onClose={() => setQuery("")}
        >
          <div className="relative max-w-xl mx-auto w-full">
            <ComboboxInput
              className="w-full rounded-sm bg-white px-10 py-1 ring ring-gray-400"
              id={id}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tags..."
            />

            <ComboboxButton className="group absolute inset-y-0 left-0 px-3">
              <PiHash className="size-4 fill-black/60 group-data-hover:fill-black" />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor="bottom"
            transition
            className="z-50 w-(--input-width) rounded-sm border border-gray-600 bg-white p-1 shadow-xl transition duration-100 ease-in [--anchor-gap:--spacing(1)] empty:invisible data-leave:data-closed:opacity-0"
          >
            {filteredTags.map((tag) => (
              <ComboboxOption
                key={tag.id}
                value={tag}
                className="group flex cursor-default items-center gap-2 rounded-lg px-3 py-1.5 select-none data-focus:bg-black/10"
              >
                <PiCheckBold className="invisible size-4 fill-black group-data-selected:visible" />
                <div className="text-sm/6 text-black">{tag.name}</div>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </div>
    </div>
  );
}

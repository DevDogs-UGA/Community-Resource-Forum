"use client";

import { useId } from "react";
import { PiHash, PiMagnifyingGlass, PiTagBold, PiXBold } from "react-icons/pi";
import * as Combobox from "~/components/Combobox";
import useTagSelector from "~/hooks/useTagSelector";

interface Props {
  inputName: string;
  defaultValue?: string[];
}

export default function SelectTags({ inputName, defaultValue }: Props) {
  const { query, setQuery, queried, selected } = useTagSelector(defaultValue);
  const id = useId();

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        className="mx-auto flex w-full items-center gap-2 font-bold"
        htmlFor={id}
      >
        <PiTagBold className="-scale-x-100" /> Tags
      </label>

      <div className="mx-auto flex w-full flex-wrap gap-x-1.5 gap-y-1.5 text-sm not-empty:pb-1 empty:hidden">
        {selected.map(({ tag, deselect }) => (
          <div
            key={tag.id}
            className="flex overflow-hidden rounded-sm border border-sky-800 shadow-xs"
          >
            <input type="hidden" name={inputName} value={tag.id} readOnly />
            <p className="line-clamp-1 flex-1 bg-sky-50 py-0.5 pr-6 pl-1.5 text-nowrap overflow-ellipsis">
              {tag.name}
            </p>
            <button
              type="button"
              className="bg-sky-800 px-1.5 py-0.5 text-white transition-colors hover:bg-sky-700"
              onClick={deselect}
            >
              <PiXBold />
            </button>
          </div>
        ))}
      </div>

      <Combobox.Root popover>
        <label className="relative mx-auto w-full">
          <Combobox.Input
            className="w-full rounded-sm bg-white px-10 py-1 ring ring-gray-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tags..."
            id={id}
            value={query}
          />

          <span className="group absolute top-1/2 left-0 -translate-y-1/2 px-3">
            <PiMagnifyingGlass className="size-4 fill-black/60 group-data-hover:fill-black" />
          </span>
        </label>

        <Combobox.Options className="group w-full origin-top transition-opacity perspective-distant data-[state=closed]:pointer-events-none! data-[state=closed]:opacity-0 data-[state=open]:pointer-events-auto!">
          <div className="bg-scroll-shadow max-h-65.5 w-full scroll-py-1 space-y-1 overflow-y-scroll rounded-sm border border-gray-600 p-1 shadow-xl transition-[transform,opacity,scale] transform-3d group-data-[state=closed]:scale-95 group-data-[state=closed]:-rotate-x-12">
            {queried.length <= 0 && (
              <p className="px-3 py-1 text-sm text-gray-500 italic">
                No results found.
              </p>
            )}
            {queried.map(({ tag, select, disabled }) => (
              <Combobox.Option
                key={tag.id}
                onClick={select}
                className="group flex w-full cursor-default items-center gap-1.5 rounded-sm px-3 py-0.5 select-none disabled:cursor-not-allowed disabled:opacity-60 data-focus:bg-gray-200"
                disabled={disabled}
              >
                {tag.depth === 0 ? (
                  <PiHash className="size-[1em] text-gray-500" />
                ) : (
                  <span
                    className="ml-[calc(var(--spacing)*(var(--depth)*7.5))] block size-4 pr-0.5 pb-1.5"
                    style={
                      {
                        "--depth": tag.depth,
                      } as React.CSSProperties
                    }
                  >
                    <span className="block size-full rounded-bl-sm border-b-2 border-l-2 border-gray-400" />
                  </span>
                )}

                <div className="text-sm/6">{tag.name}</div>
              </Combobox.Option>
            ))}
          </div>
        </Combobox.Options>
      </Combobox.Root>
    </div>
  );
}

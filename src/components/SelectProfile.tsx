"use client";

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useCallback, useId, useState } from "react";
import { PiCaretDownBold, PiCheckBold, PiUsersBold } from "react-icons/pi";
import Avatar from "~/components/Avatar";
import type { profiles } from "~/db/schema";

type Profile = (typeof profiles)["$inferSelect"];

interface Props {
  profiles: [Profile, ...Profile[]];
}

export default function SelectProfile({ profiles }: Props) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<Profile>(profiles[0]);
  const id = useId();

  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(query.toLowerCase()),
  );

  const updateSelection = useCallback((profile: Profile | null) => {
    if (profile) {
      setValue(profile);
      setQuery("");
    }
  }, []);

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="flex items-center gap-2 font-bold max-w-xl mx-auto w-full" htmlFor={id}>
        <PiUsersBold className="-scale-x-100" /> Post as
      </label>

      <div className="relative -mx-8 bg-gray-200 px-8 py-4">
        <input type="hidden" name="authorId" value={value?.id ?? ""} readOnly />
        <Combobox
          immediate
          value={value}
          onChange={updateSelection}
          onClose={() => setQuery("")}
        >
          <div className="relative max-w-xl mx-auto w-full">
            <ComboboxInput
              className="w-full rounded-sm bg-white py-1 pr-10 pl-3 ring ring-gray-400"
              id="select-profile-combobox-input"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(p: Profile) => p.name}
            />

            <ComboboxButton className="group absolute inset-y-0 right-0 px-3">
              <PiCaretDownBold className="size-4 fill-black/60 group-data-hover:fill-black" />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor="bottom"
            transition
            className="z-50 w-(--input-width) rounded-sm border border-gray-600 bg-white p-1 shadow-xl transition duration-100 ease-in [--anchor-gap:--spacing(1)] empty:invisible data-leave:data-closed:opacity-0"
          >
            {filteredProfiles.map((profile) => (
              <ComboboxOption
                key={profile.id}
                value={profile}
                className="group flex cursor-default items-center gap-2 rounded-sm px-3 py-1.5 select-none data-focus:bg-black/10"
              >
                <div className="flex flex-1 items-center gap-3 py-0.5 text-xl text-black">
                  <Avatar {...profile} />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm/[1]">{profile.name}</span>
                    <span className="text-[0.6rem]/[1] font-bold text-gray-600 uppercase">
                      {profile.type}
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

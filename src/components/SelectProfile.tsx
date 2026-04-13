"use client";

import * as Select from "@radix-ui/react-select";
import { useEffect, useMemo, useState } from "react";
import { PiCaretDownBold, PiCheckBold } from "react-icons/pi";
import Avatar from "~/components/Avatar";
import type { profiles } from "~/server/db/schema/tables";

type Profile = (typeof profiles)["$inferSelect"];

interface ProfilePreviewProps {
  profile: Profile;
}

function ProfilePreview({ profile }: ProfilePreviewProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="flex flex-1 items-center gap-2 text-black">
        <span className="text-xl/0">
          <Avatar {...profile} />
        </span>
        <span className="text-sm/none">{profile.name}</span>
      </p>
      <PiCheckBold className="invisible size-4 fill-black group-data-[state=checked]:visible" />
    </div>
  );
}

interface Props {
  inputName: string;
  userProfile: Profile;
  organizationProfiles: Profile[];
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}

export default function SelectProfile({
  inputName,
  userProfile,
  organizationProfiles,
  defaultValue,
  value: controlledValue,
  onChange
}: Props) {
  const [value, setValue] = useState<string>(defaultValue ?? userProfile.id);
  const selectedProfile = useMemo(
    () => [userProfile, ...organizationProfiles].find((p) => p.id === value)!,
    [value, userProfile, organizationProfiles],
  );

  useEffect(() => {
    onChange?.(value)
  }, [value, onChange]);

  return (
    <>
      <Select.Root value={controlledValue ?? value} onValueChange={setValue}>
        <Select.Trigger className="relative mx-auto w-full rounded-sm bg-white py-1.5 pr-10 pl-3 ring ring-gray-400">
          <Select.Value aria-label={selectedProfile.name}>
            <ProfilePreview profile={selectedProfile} />
          </Select.Value>

          <Select.Icon className="group absolute inset-y-0 top-1/2 right-0 -translate-y-1/2 px-3">
            <PiCaretDownBold className="size-4 fill-black/60 group-data-hover:fill-black" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="group z-100 w-(--radix-select-trigger-width) rounded-md border border-gray-600 bg-white py-1.5 shadow-xl"
          >
            <Select.Viewport className="space-y-2">
              <Select.Group className="space-y-0.5">
                <Select.Label className="px-2 pb-0.5 text-[0.66rem] font-semibold tracking-wide text-gray-500 uppercase">
                  Users
                </Select.Label>
                <Select.Item
                  className="group px-3 py-1.5 transition-colors hover:bg-gray-200 data-[state=checked]:bg-gray-100"
                  value={userProfile.id}
                >
                  <ProfilePreview profile={userProfile} />
                </Select.Item>
              </Select.Group>

              {organizationProfiles.length > 0 && (
                <>
                  <Select.Separator className="h-px w-full bg-gray-400" />
                  <Select.Group className="space-y-0.5">
                    <Select.Label className="px-2 pb-0.5 text-[0.66rem] font-semibold tracking-wide text-gray-500 uppercase">
                      Organizations
                    </Select.Label>
                    {[userProfile, userProfile, userProfile].map((org) => (
                      <Select.Item
                        className="group px-3 py-1.5 transition-colors hover:bg-gray-200 data-[state=checked]:bg-gray-100"
                        value={org.id}
                        key={org.id}
                      >
                        <ProfilePreview profile={userProfile} />
                      </Select.Item>
                    ))}
                  </Select.Group>
                </>
              )}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <input
        type="hidden"
        name={inputName}
        value={selectedProfile.id}
        required
        readOnly
      />
    </>
  );
}

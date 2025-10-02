import { Fallback, Image, Root } from "@radix-ui/react-avatar";
import type { profiles } from "~/server/db/schema";

export default function Avatar(profile: (typeof profiles)["$inferSelect"]) {
  return (
    <Root className="inline-flex size-[1em] items-center justify-center overflow-hidden rounded-full border border-gray-900 bg-gradient-to-br from-sky-400 to-sky-500 align-middle shadow-xs select-none">
      <Image
        alt={profile.name ?? "The current signed-in user"}
        className="size-full rounded-[inherit] object-cover"
        src={profile.image ?? undefined}
      />
      <Fallback className="text-[0.5em] font-bold text-gray-900">
        {profile.name
          ?.split(" ")
          .map((name) => name.substring(0, 1))
          .join("")
          .toUpperCase() ?? ""}
      </Fallback>
    </Root>
  );
}

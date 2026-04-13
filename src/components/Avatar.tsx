import { Image as AvatarImage, Fallback, Root } from "@radix-ui/react-avatar";
import { getImageProps } from "next/image";
import type { profiles } from "~/server/db/schema/tables";

export default function Avatar(profile: (typeof profiles)["$inferSelect"]) {
  const imageProps = profile.image
    ? getImageProps({
        alt: profile.name ?? "The current signed-in user",
        src: `/uploads/${profile.id}/${profile.image}`,
        height: 128,
        width: 128,
      })
    : null;

  return (
    <Root className="inline-flex size-[1em] items-center justify-center overflow-hidden rounded-full border border-gray-900 bg-linear-to-br from-sky-400 to-sky-500 align-middle shadow-xs select-none">
      {imageProps && <AvatarImage {...imageProps.props} />}
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

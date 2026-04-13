"use client";

import { useState, type ComponentProps } from "react";
import { PiCameraDuotone } from "react-icons/pi";
import Avatar from "./Avatar";
import FilePicker from "./FilePicker";
import type { FileDetails } from "~/server/s3";
import { createAttachmentUpload } from "~/server/actions/post";

interface Props {
  profile: ComponentProps<typeof FilePicker>["profile"] &
    ComponentProps<typeof Avatar>;
}

export default function UploadProfilePhoto({ profile }: Props) {
  const [value, setValue] = useState<FileDetails[]>([]);

  return (
    <>
      <FilePicker
        profile={profile}
        allowTypes={[
          "image/jpg",
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/svg",
          "image/ico",
          "image/jp2",
        ]}
        value={value}
        onChange={setValue}
        getPresignedUrls={createAttachmentUpload}
      >
        <button className="relative rounded-full text-8xl/0 transition-shadow hover:shadow-sm">
          <Avatar {...profile} />
          <span className="absolute inset-0 flex size-full items-center justify-center rounded-full bg-black text-5xl text-gray-300 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-70">
            <PiCameraDuotone />
          </span>
        </button>
      </FilePicker>
    </>
  );
}

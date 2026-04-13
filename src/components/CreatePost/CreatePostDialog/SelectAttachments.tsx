"use client";

import { useCallback, useState, type ComponentProps } from "react";
import { PiArrowSquareOutBold, PiLinkBold, PiUploadSimpleBold, PiXBold } from "react-icons/pi";
import AttachmentBadge from "~/components/AttachmentBadge";
import { createAttachmentUpload } from "~/server/actions/post";
import type { FileDetails } from "~/server/s3";
import FilePicker from "../../FilePicker";

export default function SelectAttachments(
  props: Omit<
    ComponentProps<typeof FilePicker>,
    "value" | "onChange" | "getPresignedUrls"
  >,
) {
  const [files, setFiles] = useState<FileDetails[]>([]);
  const createHandleRemoveFile = useCallback((contentHash: string) => {
    return () => {
      setFiles((files) => files.filter((f) => f.contentHash !== contentHash));
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label className="mx-auto flex w-full items-center gap-2 font-bold">
        <PiLinkBold /> Attach Files
      </label>

      {files.map((file) => (
        <div key={file.contentHash} className="flex items-center gap-1.5">
          <input type="hidden" name="attachments" value={file.contentHash} />
          <button
            type="button"
            className="aspect-square rounded-full p-1.5 text-sm text-red-900/70 transition-colors hover:bg-red-500/20 hover:text-red-800"
            onClick={createHandleRemoveFile(file.contentHash)}
          >
            <PiXBold />
          </button>
          <AttachmentBadge file={file} />
        </div>
      ))}

      <FilePicker
        {...props}
        value={files}
        onChange={setFiles}
        getPresignedUrls={createAttachmentUpload}
      >
        <button
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-gray-400 bg-white py-3 text-sm font-medium text-gray-800 data-drag-over:border-solid data-drag-over:border-sky-600 data-drag-over:shadow-md"
          type="button"
        >
          <span className="pointer-events-none flex items-center justify-center gap-2 group-hover:text-gray-500 group-data-drag-over:text-black">
            <PiUploadSimpleBold />
            Drag File Here
          </span>
          <span className="pointer-events-none text-[0.66rem] text-gray-500 uppercase">
            Or
          </span>
          <span className="pointer-events-none flex items-center justify-center gap-2 group-hover:text-black group-data-drag-over:text-gray-500">
            Click to Select from Previous Uploads <PiArrowSquareOutBold />
          </span>
        </button>
      </FilePicker>
    </div>
  );
}

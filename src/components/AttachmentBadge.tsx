import { getDate } from "date-fns";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import {
  PiCalendarBlank,
  PiFile
} from "react-icons/pi";
import formatEventTime from "~/lib/formatEventTime";
import type { events, uploads } from "~/server/db/schema/tables";
import type { FileDetails } from "~/server/s3";

interface LinkWrapperProps extends PropsWithChildren {
  href?: string;
}

function LinkWrapper({ href, children }: LinkWrapperProps) {
  return href ? (
    <Link className="contents" href={href} target="_blank">
      {children}
    </Link>
  ) : (
    <p className="contents">{children}</p>
  );
}

type Props =
  | {
      preview?: boolean;
      event: typeof events.$inferSelect;
    }
  | {
      preview?: boolean;
      file: FileDetails;
    };

export default function AttachmentBadge(props: Props) {
  return (
    <LinkWrapper
      href={
        !props.preview
          ? "event" in props
            ? `/events/${props.event.id}`
            : "file" in props
              ? `/uploads/${props.file.ownerId}/${props.file.contentHash}`
              : undefined
          : undefined
      }
    >
      <span className="flex flex-1 items-center gap-3 rounded-sm border border-gray-300 bg-gray-50 hover:bg-gray-100 px-2 py-1.5 text-xl text-black shadow-xs">
        <span className="relative">
          {"event" in props ? (
            <>
              <PiCalendarBlank />
              <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-px text-center text-[0.55rem] font-bold">
                {getDate(props.event.start)}
              </span>
            </>
          ) : (
            <>
              <PiFile />
              <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-1 text-center text-[0.3rem] font-semibold uppercase">
                {props.file.name.split(".").at(-1)}
              </span>
            </>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="-mt-0.5 overflow-x-hidden text-xs overflow-ellipsis">
            {"event" in props ? props.event.title : props.file.name}
          </span>
          <span className="text-[0.6rem]/[1] font-bold text-gray-600">
            {"event" in props
              ? formatEventTime(props.event)
              : `${props.file.size} bytes`}
          </span>
        </span>

        {!props.preview && "event" in props && (
          <button className="rounded-xs px-2 py-0.5 text-xs font-bold text-sky-800 uppercase ring-sky-800/50 hover:bg-sky-100 hover:ring">
            RSVP
          </button>
        )}
      </span>
    </LinkWrapper>
  );
}

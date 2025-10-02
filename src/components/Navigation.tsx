import * as Dropdown from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import {
  PiCalendarPlus,
  PiPlus,
  PiSignInBold,
  PiSignOut,
} from "react-icons/pi";
import devdog from "~/assets/devdog.png";
import signIn from "~/server/actions/signIn";
import signOut from "~/server/actions/signOut";
import { getSessionUser } from "~/server/auth";
import Avatar from "./Avatar";

export default async function Navigation() {
  const session = await getSessionUser({
    with: {
      profile: true,
    },
  });

  return (
    <nav className="sticky top-0 left-0 z-40 flex w-full items-center justify-between border-t-4 border-b border-t-sky-800 border-b-gray-300 bg-white px-3 py-3">
      <Link className="text-3xl" href="/">
        <figure className="size-[1em]">
          <Image alt="Dev Dog" src={devdog} />
        </figure>
      </Link>

      {session ? (
        <Dropdown.Root>
          <Dropdown.Trigger className="text-[2rem] leading-none">
            <Avatar {...session.user.profile} />
          </Dropdown.Trigger>

          <Dropdown.Portal>
            <Dropdown.Content
              className="z-50 flex min-w-40 flex-col rounded-md border border-gray-400 bg-white py-1.5 text-sm shadow-xl"
              align="end"
              sideOffset={4}
            >
              <Dropdown.Item asChild>
                <Link
                  href="/create/post"
                  className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                >
                  <PiPlus />
                  New Post
                </Link>
              </Dropdown.Item>

              <Dropdown.Item asChild>
                <Link
                  href="/create/event"
                  className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                >
                  <PiCalendarPlus />
                  New Event
                </Link>
              </Dropdown.Item>

              <Dropdown.Separator className="mx-2 my-1.5 h-px bg-gray-400" />

              <form action={signOut} className="contents">
                <Dropdown.Item asChild>
                  <button
                    className="flex items-center gap-3 py-1 pr-6 pl-3 text-red-700 transition-colors hover:bg-red-100 hover:text-red-800"
                    type="submit"
                  >
                    <PiSignOut />
                    Sign Out
                  </button>
                </Dropdown.Item>
              </form>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      ) : (
        <form action={signIn} className="contents">
          <button
            className="flex cursor-default items-center gap-1.5 rounded-sm border-b-2 border-sky-900 bg-sky-800 px-4 py-1 text-sm font-medium text-white shadow-sm ring-1 ring-sky-950 transition-colors hover:bg-sky-50 hover:text-sky-800 focus:mt-0.5 focus:border-b-0"
            type="submit"
          >
            <span className="contents">
              Sign In <PiSignInBold />
            </span>
          </button>
        </form>
      )}
    </nav>
  );
}

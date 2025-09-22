import * as Dropdown from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { PiCalendarPlus, PiPlus } from "react-icons/pi";
import devdog from "~/assets/devdog.png";
import { getSessionUser } from "~/auth/server";
import Avatar from "./Avatar";
import SignIn from "./SignIn";
import SignOut from "./SignOut";

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
                  href="/draft"
                  className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                >
                  <PiPlus />
                  New Post
                </Link>
              </Dropdown.Item>

              <Dropdown.Item asChild>
                <Link
                  href="/draft"
                  className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                >
                  <PiCalendarPlus />
                  New Event
                </Link>
              </Dropdown.Item>

              <Dropdown.Separator className="mx-2 my-1.5 h-px bg-gray-400" />

              <Dropdown.Item asChild>
                <SignOut />
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      ) : (
        <SignIn />
      )}
    </nav>
  );
}

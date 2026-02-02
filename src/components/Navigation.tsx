import * as Dropdown from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import {
  PiCalendarDotsDuotone,
  PiCalendarPlus,
  PiCardsThreeDuotone,
  PiCaretDownBold,
  PiDetectiveDuotone,
  PiPlus,
  PiSignInBold,
  PiSignOut,
  PiSquaresFourDuotone,
  PiUser,
  PiXBold,
} from "react-icons/pi";
import devdog from "~/assets/devdog.png";
import signIn from "~/server/actions/signIn";
import signOut from "~/server/actions/signOut";
import { getSessionUser } from "~/server/auth";
import { db } from "~/server/db";
import Avatar from "./Avatar";
import NavigationLink from "./NavigationLink";
import SearchDialog from "./SearchDialog";

export default async function Navigation() {
  const tags = await db.query.tags.findMany();
  const session = await getSessionUser({
    with: {
      profile: true,
      organizations: {
        with: {
          organization: true,
        },
      },
    },
  });

  const profiles = session
    ? [
        session.user.profile,
        ...session.user.organizations
          .filter((rel) => rel.role === "officer" || rel.role === "owner")
          .map((rel) => rel.organization),
      ]
    : null;

  return (
    <nav className="sticky top-0 left-0 z-40 border-t-4 border-b border-t-sky-800 border-b-gray-300 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex w-2/5 min-w-100 items-center gap-8 px-4 py-2">
          <h1 className="flex items-center gap-1.5">
            <Link href="https://devdogs.uga.edu/" target="_blank">
              <figure className="size-8">
                <Image alt="Dev Dog" src={devdog} />
              </figure>
            </Link>
            <PiXBold className="text-base text-gray-400" />
            <Link
              href="/"
              className="flex flex-col pl-0.5 text-xs leading-none font-bold text-sky-950"
            >
              <span>Community</span>
              <span>Resource</span>
              <span>Forum</span>
            </Link>
          </h1>

          <SearchDialog tags={tags} />
        </div>

        <div className="grid auto-cols-fr grid-flow-col">
          <NavigationLink href="/posts">
            <PiSquaresFourDuotone className="text-2xl" />
            <span className="text-xs leading-none font-medium tracking-[.0125em]">
              Posts
            </span>
          </NavigationLink>

          <NavigationLink href="/collections">
            <PiCardsThreeDuotone className="text-2xl" />
            <span className="text-xs leading-none font-medium tracking-[.0125em]">
              Collections
            </span>
          </NavigationLink>

          <NavigationLink href="/calendar">
            <PiCalendarDotsDuotone className="text-2xl" />
            <span className="text-xs leading-none font-medium tracking-[.0125em]">
              Calendar
            </span>
          </NavigationLink>

          {session?.user.role === "moderator" && (
            <NavigationLink href="/moderate">
              <PiDetectiveDuotone className="text-2xl" />
              <span className="text-xs leading-none font-medium tracking-[.0125em]">
                Moderation
              </span>
            </NavigationLink>
          )}

          {session && profiles ? (
            <Dropdown.Root>
              <Dropdown.Trigger className="flex flex-col items-center gap-0.75 px-3 py-2 text-2xl leading-none transition-colors hover:bg-sky-200 data-[state=open]:bg-sky-200">
                <span className="flex">
                  <Avatar {...session.user.profile} />
                </span>
                <span className="flex items-center gap-0.75 text-xs leading-none font-medium tracking-[.0125em]">
                  Profiles <PiCaretDownBold className="text-[0.5rem]" />
                </span>
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content
                  className="z-50 flex min-w-40 flex-col rounded-md border border-gray-400 bg-white py-1.5 text-sm shadow-xl"
                  align="end"
                  sideOffset={-4}
                  alignOffset={4}
                >
                  {/* <Dropdown.Item asChild>
                    <Link
                      href={`/profile/${session.userId}`}
                      className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                    >
                      <PiUser />
                      My Profile
                    </Link>
                  </Dropdown.Item> */}

                  {profiles.map((profile) => (
                    <Dropdown.Item key={profile.id} asChild>
                      <Link
                        className="flex flex-1 items-center gap-3 py-1.5 hover:bg-gray-200 text-2xl text-black pr-9 pl-3"
                        href={`/profile/${profile.id}`}
                      >
                        <Avatar {...profile} />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm/[1]">{profile.name}</span>
                          <span className="text-[0.6rem]/[1] font-bold text-gray-600 uppercase">
                            {profile.type}
                          </span>
                        </span>
                      </Link>
                    </Dropdown.Item>
                  ))}

                  <Dropdown.Separator className="mx-2 my-1.5 h-px bg-gray-400" />

                  <Dropdown.Item asChild>
                    <Link
                      href="/create/post"
                      className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                    >
                      <PiPlus />
                      Create Post
                    </Link>
                  </Dropdown.Item>

                  <Dropdown.Item asChild>
                    <Link
                      href="/create/event"
                      className="flex items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200"
                    >
                      <PiCalendarPlus />
                      Create Event
                    </Link>
                  </Dropdown.Item>

                  <Dropdown.Separator className="mx-2 my-1.5 h-px bg-gray-400" />

                  <form action={signOut} className="contents">
                    <button
                      className="flex items-center gap-3 py-1 pr-6 pl-3 text-red-700 transition-colors hover:bg-red-100 hover:text-red-800"
                      type="submit"
                    >
                      <PiSignOut />
                      Sign Out
                    </button>
                  </form>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          ) : (
            <form action={signIn} className="contents">
              <button
                className="flex self-center cursor-default items-center mx-1 gap-1.5 rounded-sm border-b-2 border-sky-900 bg-sky-800 px-3 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-sky-950 transition-colors hover:bg-sky-50 hover:text-sky-800 focus:mt-0.5 focus:border-b-0"
                type="submit"
              >
                <span className="contents">
                  Sign In <PiSignInBold />
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}

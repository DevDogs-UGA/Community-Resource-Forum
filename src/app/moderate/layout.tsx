"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  href: string;
}

export function NavItem({ href, children }: Props) {
  const pathname = usePathname();

  return (
    <li className="contents">
      <Link
        data-active={pathname.startsWith(href) || undefined}
        href={href}
        className="border-sky-900 px-6 py-3 transition-colors hover:bg-sky-200 hover:text-gray-800 data-active:-mb-px data-active:border-b-2 data-active:pb-3.25 data-active:not-hover:bg-sky-50"
      >
        {children}
      </Link>
    </li>
  );
}

export default function ModerationNavigation({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex-1 bg-gray-100">
      <header className="sticky top-15 z-50 border-b border-b-gray-300 bg-white">
        <nav className="mx-auto flex max-w-7xl justify-center px-4 text-sm font-medium">
          <ul className="contents">
            <NavItem href="/moderate/review/posts">Posts to Review</NavItem>
            <NavItem href="/moderate/quarantine/posts">
              Quarantined Posts
            </NavItem>
            <NavItem href="/moderate/review/comments">
              Comments to Review
            </NavItem>
            <NavItem href="/moderate/quarantine/comments">
              Quarantined Comments
            </NavItem>
          </ul>
        </nav>
      </header>
      {children}
    </div>
  );
}

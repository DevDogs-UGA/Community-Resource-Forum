"use client";

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props extends PropsWithChildren {
  href: string;
}

export default function NavigationLink({ href, children }: Props) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.75 border-0 border-sky-950 px-3 py-2 transition-colors hover:bg-sky-200 data-active:-mb-px data-active:border-b-2 data-active:pb-1.75 data-active:not-hover:bg-sky-50"
      data-active={pathname.startsWith(href) || undefined}
    >
      {children}
    </Link>
  );
}

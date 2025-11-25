"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { PiFlagBold, PiChatTextBold, PiArchiveBold } from "react-icons/pi";

const toggleGroupItemClasses =
  "cursor-pointer flex justify-start items-center w-64 h-[35px] gap-4 px-4 py-6 rounded-lg bg-white hover:bg-gray-100 transition-colors focus:z-10 data-[state=on]:bg-gray-200";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const [value, setValue] = useState(() => {
    switch (pathname) {
      case "/admin/flagged":
        return "flagged";
      case "/admin/archived":
        return "archived";
      case "/admin/comments":
        return "comments";
      default:
        return "flagged";
    }
  });

  const handleValueChanged = (newValue: string) => {
    // Handle navigation based on the selected value
    switch (newValue) {
      case "flagged":
        router.push("/admin/flagged");
        break;
      case "archived":
        router.push("/admin/archived");
        break;
      case "comments":
        router.push("/admin/comments");
        break;
      default:
        return;
    }

    setValue(newValue);
  };

  return (
    <div className="flex min-h-full min-w-[300px] items-start bg-white">
      <ToggleGroup.Root
        className="bg-mauve6 sticky top-16 h-auto min-h-[calc(100vh-64px)] space-y-4 border-r border-r-gray-300 px-3 py-6"
        type="single"
        value={value}
        aria-label="admin dashboard navigation"
        orientation="vertical"
        onValueChange={handleValueChanged}
      >
        <ToggleGroup.Item
          className={toggleGroupItemClasses}
          value="flagged"
          aria-label="flagged posts"
        >
          <PiFlagBold />
          Flagged
        </ToggleGroup.Item>
        <ToggleGroup.Item
          className={toggleGroupItemClasses}
          value="archived"
          aria-label="archived posts"
        >
          <PiArchiveBold />
          Archived
        </ToggleGroup.Item>
        <ToggleGroup.Item
          className={toggleGroupItemClasses}
          value="comments"
          aria-label="archived comments"
        >
          <PiChatTextBold />
          Comments
        </ToggleGroup.Item>
        {/* <ToggleGroup.Item className={toggleGroupItemClasses} value="">hello</ToggleGroup.Item> */}
      </ToggleGroup.Root>
      {children}
    </div>
  );
}

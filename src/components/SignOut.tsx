"use client";

import { PiSignOut } from "react-icons/pi";
import { useAuth } from "~/auth/client";

export default function SignOut() {
  const { signOut } = useAuth();

  return (
    <button
      className="flex items-center gap-3 py-1 pr-6 pl-3 text-red-700 transition-colors hover:bg-red-100 hover:text-red-800"
      onClick={signOut}
    >
      <PiSignOut />
      Sign Out
    </button>
  );
}

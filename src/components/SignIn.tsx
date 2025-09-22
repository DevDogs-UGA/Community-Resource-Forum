"use client";

import { PiSignInBold } from "react-icons/pi";
import { useAuth } from "~/auth/client";

export default function SignIn() {
  const { signIn } = useAuth();
  console.log( useAuth());

  return (
    <button
      className="flex cursor-default items-center gap-1.5 rounded-sm border-b-2 border-sky-900 bg-sky-800 px-4 py-1 text-sm font-medium text-white shadow-sm ring-1 ring-sky-950 transition-colors hover:bg-sky-50 hover:text-sky-800 focus:mt-0.5 focus:border-b-0"
      onClick={signIn}
    >
      <span className="contents">
        Sign In <PiSignInBold />
      </span>
    </button>
  );
}

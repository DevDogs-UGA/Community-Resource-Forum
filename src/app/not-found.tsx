"use client";

import { useRouter } from "next/navigation";

import { PiSmileySadLight } from "react-icons/pi";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center bg-gray-100">
      <PiSmileySadLight className="text-[500px]" />
      <h1 className="mb-4 text-4xl font-bold">Page not found.</h1>
      <p className="text-lg text-gray-600">
        Sorry, the page you are looking for does not exist.
      </p>
      <div
        className="mt-6 cursor-pointer rounded-lg bg-gray-200 px-4 py-2 transition-colors hover:bg-gray-300"
        onClick={() => router.back()}
      >
        Go back
      </div>
    </div>
  );
}

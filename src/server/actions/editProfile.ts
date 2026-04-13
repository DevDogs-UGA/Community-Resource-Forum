"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/dist/client/components/unstable-rethrow.server";
import { redirect } from "next/navigation";
import { expectSession } from "~/server/auth";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema/tables";
import { hasPermissions } from "../db/permissions";

export default async function editProfile(formData: FormData) {
  const session = await expectSession({
    user: {
      with: {
        profile: {
          with: {
            events: true,
          },
        },
        organizationPermissions: {
          where: {
            RAW: hasPermissions("EDIT_PROFILE"),
          },
          with: {
            profile: true,
          },
        },
      },
    },
  });

  const id = formData.get("id");
  const name = formData.get("name");
  const bio = formData.get("bio");
  const linkedin = formData.get("linkedin");
  const github = formData.get("github");
  const personalSite = formData.get("personalSite");

  const profile =
    session &&
    (id === session.userProfileId
      ? session.user.profile
      : session.user.organizationPermissions.find(
          (org) => org.organizationProfileId === id,
        )?.profile);

  if (!profile || !id || typeof id !== "string") {
    throw new Error("Invalid profile ID.");
  }

  const updates: Record<string, unknown> = {};

  if (typeof name === "string") updates.name = name;
  if (typeof bio === "string") updates.bio = bio;
  if (typeof personalSite === "string" && personalSite.length <= 255)
    updates.personalSite = personalSite;

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidLinkedIn = (url: string) => {
    return (
      typeof url === "string" &&
      url.length <= 255 &&
      isValidUrl(url) &&
      (url.startsWith("https://www.linkedin.com/") ||
        url.startsWith("https://linkedin.com/")) &&
      /^https:\/\/(www\.)?linkedin\.com\/.*$/.test(url)
    );
  };

  const isValidGitHub = (url: string) => {
    return (
      typeof url === "string" &&
      url.length <= 255 &&
      isValidUrl(url) &&
      (url.startsWith("https://github.com/") ||
        url.startsWith("https://www.github.com/")) &&
      /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?$/.test(url)
    );
  };

  if (typeof linkedin === "string" && isValidLinkedIn(linkedin))
    updates.linkedin = linkedin;
  if (typeof github === "string" && isValidGitHub(github))
    updates.github = github;

  try {
    await db.update(profiles).set(updates).where(eq(profiles.id, id));
    revalidatePath(`/profile/${session.userProfileId}`);
    redirect(`/profile/${session.userProfileId}`);
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    throw new Error("Failed to save changes to database.");
  }
}

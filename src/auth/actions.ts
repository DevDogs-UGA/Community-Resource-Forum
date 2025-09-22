"use server";

import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "~/db";
import { sessions } from "~/db/schema";
import { env } from "~/env";

export async function __signInAction() {
  const googleOAuth2 = new google.auth.OAuth2(
    env.AUTH_GOOGLE_ID,
    env.AUTH_GOOGLE_SECRET,
    new URL("/api/auth/callback/google", String((await headers()).get("referer"))).toString(),
  );

  redirect(
    googleOAuth2.generateAuthUrl({
      access_type: "online",
      hd: "uga.edu",
      include_granted_scopes: true,
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    }),
  );
}

export async function __signOutAction() {
  const jar = await cookies();
  const token = jar.get("session")?.value;

  if (token) {
    jar.delete("session");
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  redirect("/");
}

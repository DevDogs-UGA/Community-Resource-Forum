import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";
import { profiles, sessions, users } from "~/server/db/schema";
import { env } from "~/env";

export const googleOAuth2 = new google.auth.OAuth2(
  env.AUTH_GOOGLE_ID,
  env.AUTH_GOOGLE_SECRET,
  env.AUTH_REDIRECT_URL,
);

/**
 * Gets the currently signed in user.
 * @param include Specify data to include or exclude for the signed-in user using a Drizzle soft-relation query.
 * @returns `null` if the user is not signed in, or an object with user data if the user is signed in.
 */
export async function getSessionUser<
  T extends Exclude<
    ((Parameters<typeof db.query.sessions.findFirst>[0] & {})["with"] & {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      user: {};
    })["user"],
    true
  >,
>(include?: T) {
  const token = (await cookies()).get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
    with: {
      user: include ?? true,
    },
  });

  return session ?? null;
}

export async function handleOAuthRedirect(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code === null) {
    notFound();
  }

  const { tokens } = await googleOAuth2.getToken(code);
  googleOAuth2.setCredentials(tokens);

  const profile = await google
    .oauth2({
      version: "v2",
      auth: googleOAuth2,
    })
    .userinfo.get({
      fields: "name,email",
    });

  if (!profile.data.email) {
    notFound();
  }

  const email = profile.data.email;

  const { id } =
    (await db.query.users.findFirst({
      where: eq(users.email, email),
    })) ??
    (await db.transaction(async (tx) => {
      const [insertedProfile] = await tx
        .insert(profiles)
        .values({
          name: profile.data.name ?? "UGA Student",
          image: profile.data.picture,
          type: "user",
        })
        .$returningId();

      const id = insertedProfile?.id;

      if (id === undefined) {
        tx.rollback();
        throw new Error("🍸 How did we get here?");
      }

      await tx.insert(users).values({
        id,
        email,
      });

      return { id };
    }));

  const [insertedSession] = await db
    .insert(sessions)
    .values({
      userId: id,
      userAgent: request.headers.get("user-agent"),
    })
    .$returningId();

  if (!insertedSession) {
    notFound();
  }

  (await cookies()).set("session", insertedSession.token);
  redirect("/");
}
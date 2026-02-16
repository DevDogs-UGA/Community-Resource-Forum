import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import * as z from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import { profiles, sessions, users } from "~/server/db/schema/tables";

export function authenticate(): never {
  redirect(
    new URL(
      "?" +
        new URLSearchParams({
          client_id: env.AUTH_CLIENT_ID,
          redirect_uri: new URL("/api/auth", env.AUTH_REDIRECT_URI).toString(),
        }).toString(),
      env.AUTH_ENDPOINT,
    ).toString(),
  );
}

/**
 * Gets the currently signed in user.
 * @param include Specify data to include or exclude for the session using a Drizzle soft-relation query.
 * @returns `null` if the user is not signed in, or an object with session data if the user is signed in.
 */
export async function getSession<
  T extends (Parameters<typeof db.query.sessions.findFirst>[0] & {})["with"],
>(include: T) {
  const token = (await cookies()).get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: {
      token: {
        eq: token,
      },
    },
    with: include,
  });

  return session ?? null;
}

/**
 * Gets the currently signed in user.
 * @param include Specify data to include or exclude for the session using a Drizzle soft-relation query.
 * @returns The session data.
 */
export async function expectSession<
  T extends (Parameters<typeof db.query.sessions.findFirst>[0] & {})["with"],
>(include: T) {
  const token = (await cookies()).get("session")?.value;

  if (!token) {
    authenticate();
  }

  const session = await db.query.sessions.findFirst({
    where: {
      token: {
        eq: token,
      },
    },
    with: include,
  });

  if (!session) {
    authenticate();
  }

  return session;
}

const profileDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email().nullish(),
  image: z.url().nullish(),
  githubUsername: z.string().nullish(),
  discordUsername: z.string().nullish(),
  linkedinUsername: z.string().nullish(),
  instagramUsername: z.string().nullish(),
  portfolioUrl: z.url().nullish(),
});

export async function handleOAuthRedirect(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code === null) {
    notFound();
  }

  const profile = await fetch(env.AUTH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.AUTH_CLIENT_ID,
      client_secret: env.AUTH_CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: new URL("/api/auth", env.AUTH_REDIRECT_URI).toString(),
    }).toString(),
  })
    .then((res) => res.json())
    .then((obj) => profileDataSchema.parseAsync(obj));

  const email = profile.id + "@uga.edu";

  const userProfileId = await db.transaction(async (tx) => {
    const existingUser = await db.query.users.findFirst({
      where: {
        email,
      },
      columns: {
        profileId: true,
      },
    });

    if (existingUser) {
      return existingUser.profileId;
    }

    const [insertedProfile] = await tx
      .insert(profiles)
      .values({
        name: profile.name ?? "UGA Student",
        image: profile.image,
        type: "user",
      })
      .$returningId();

    if (!insertedProfile) {
      return tx.rollback();
    }

    await tx.insert(users).values({
      profileId: insertedProfile.id,
      role: "user",
      email,
    });

    return insertedProfile.id;
  });

  console.log({ test: userProfileId });

  const [insertedSession] = await db
    .insert(sessions)
    .values({
      userProfileId,
      userAgent: request.headers.get("user-agent"),
    })
    .$returningId();

  if (!insertedSession) {
    notFound();
  }

  (await cookies()).set("session", insertedSession.token);
  redirect("/");
}

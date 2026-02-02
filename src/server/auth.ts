import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import * as z from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import { profiles, sessions, users } from "~/server/db/schema";

export function authenticate(): never {
  redirect(
    new URL(
      "?" +
        new URLSearchParams({
          client_id: env.AUTH_CLIENT_ID,
          redirect_uri: env.AUTH_REDIRECT_URI,
        }).toString(),
      env.AUTH_ENDPOINT,
    ).toString(),
  );
}

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

/**
 * Gets the currently signed in user.
 * @param include Specify data to include or exclude for the signed-in user using a Drizzle soft-relation query.
 * @returns The session data. If there is no session present, the user is redirected to the sign-in page.
 */
export async function expectSessionUser<
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
    authenticate();
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
    with: {
      user: include ?? true,
    },
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
      redirect_uri: env.AUTH_REDIRECT_URI,
    }).toString(),
  })
    .then((res) => res.json())
    .then((obj) => profileDataSchema.parseAsync(obj));

  const email = profile.id + "@uga.edu";

  const { id } =
    (await db.query.users.findFirst({
      where: eq(users.email, email),
    })) ??
    (await db.transaction(async (tx) => {
      const [insertedProfile] = await tx
        .insert(profiles)
        .values({
          name: profile.name ?? "UGA Student",
          image: profile.image,
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

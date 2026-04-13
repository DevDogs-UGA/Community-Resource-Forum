import "~/styles/globals.css";

import { eq } from "drizzle-orm";
import { type Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import Navigation from "~/components/Navigation";
import { TagsProvider } from "~/hooks/useTagSelector";
import OnboardingWrapper from "~/components/OnboardingModel/OnboardingWrapper";
import getAllTags from "~/server/actions/getAllTags";
import { CreatePostProvider } from "~/components/CreatePost";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/tables";

export const metadata: Metadata = {};

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession({});
  const tags = await getAllTags();

  // Check if user needs onboarding
  let needsOnboarding = false;
  if (session?.userProfileId) {
    const [user] = await db
      .select({ onboardingCompleted: users.onboardingCompleted })
      .from(users)
      .where(eq(users.profileId, session.userProfileId))
      .limit(1);

    needsOnboarding = user ? !user.onboardingCompleted : false;
  }

  return (
    <html lang="en" className={`${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <TagsProvider value={getAllTags()}>
          <CreatePostProvider>
            <OnboardingWrapper needsOnboarding={needsOnboarding} tags={tags}>
              <Navigation />
              <main className="flex-1 bg-gray-100">{children}</main>
            </OnboardingWrapper>
          </CreatePostProvider>
        </TagsProvider>
      </body>
    </html>
  );
}

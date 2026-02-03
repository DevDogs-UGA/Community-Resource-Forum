import Link from "next/link";
import { db } from "~/server/db";
import { profiles, posts, savedPosts } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser } from "~/server/auth";
import { notFound } from "next/navigation";

//This view is only visibile to each user for their own profile, as it contains the special "edit" button that actually
//allows them to edit their own

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSessionUser({
    with: {
      profile: {
        with: {
          events: true,
        },
      },
      organizations: {
        with: {
          organization: {
            with: {
              events: true,
            },
          },
        },
      },
    },
  });
  const { profileId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "saved" ? "saved" : "posts";
  const isOwnProfile = session?.userId === profileId;

  const isSignedIn =
    session &&
    (profileId === session.userId ||
      session.user.organizations.some(
        (org) => org.organizationId === profileId && org.role !== "member",
      ));

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-xl font-semibold">You must be signed in</h1>
        <Link
          href="/"
          className="rounded-md bg-sky-700 px-4 py-2 text-white hover:bg-sky-600"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile) {
    notFound();
  }

  const postsResult = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, profile.id))
    .orderBy(desc(posts.createdAt));

  // Only fetch saved posts if viewing own profile
  const savedPostsResult = isOwnProfile
    ? await db
        .select({ post: posts })
        .from(savedPosts)
        .innerJoin(posts, eq(posts.id, savedPosts.postId))
        .where(eq(savedPosts.userId, session.userId))
        .orderBy(desc(savedPosts.createdAt))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {profile.image ? (
              <img
                src={profile.image}
                alt={profile.name}
                className="mb-4 h-28 w-28 rounded-full object-cover"
              />
            ) : (
              <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gray-200 text-3xl font-bold text-gray-500">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="mb-2 text-sm text-gray-600">{profile.type}</p>
            {profile.bio && (
              <p className="mb-4 whitespace-pre-wrap text-gray-700">
                {profile.bio}
              </p>
            )}
            <div className="space-y-2 text-sm">
              {profile.linkedin && (
                <p>
                  <strong>LinkedIn:</strong>{" "}
                  <Link
                    href={profile.linkedin}
                    className="text-sky-700 hover:underline"
                    target="_blank"
                  >
                    {profile.linkedin}
                  </Link>
                </p>
              )}
              {profile.github && (
                <p>
                  <strong>GitHub:</strong>{" "}
                  <Link
                    href={profile.github}
                    className="text-sky-700 hover:underline"
                    target="_blank"
                  >
                    {profile.github}
                  </Link>
                </p>
              )}
              {profile.personalSite && (
                <p>
                  <strong>Personal Site:</strong>{" "}
                  <Link
                    href={profile.personalSite}
                    className="text-sky-700 hover:underline"
                    target="_blank"
                  >
                    {profile.personalSite}
                  </Link>
                </p>
              )}
            </div>
            {isSignedIn && (
              <div className="mt-6">
                <Link
                  href={`/profile/${profileId}/edit`}
                  className="rounded-md bg-sky-700 px-4 py-2 text-white hover:bg-sky-600"
                >
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Tabs - only show if viewing own profile */}
          {isOwnProfile && (
            <div className="mb-4 flex border-b border-gray-200">
              <Link
                href={`/profile/${profileId}`}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "posts"
                    ? "border-b-2 border-sky-700 text-sky-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Posts
              </Link>
              <Link
                href={`/profile/${profileId}?tab=saved`}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "saved"
                    ? "border-b-2 border-sky-700 text-sky-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Saved Posts
              </Link>
            </div>
          )}

          {!isOwnProfile && (
            <h2 className="mb-4 text-xl font-semibold">Posts</h2>
          )}

          {activeTab === "posts" ? (
            <>
              {postsResult.length === 0 ? (
                <div className="text-gray-600">No posts yet.</div>
              ) : (
                <div className="space-y-4">
                  {postsResult.map((post) => {
                    const created = post.createdAt
                      ? new Date(post.createdAt).toLocaleString()
                      : "";
                    return (
                      <article
                        key={post.id}
                        className="rounded-xl border bg-white p-4 shadow-sm"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="text-sm text-gray-600">
                            Posted {created}
                          </div>
                          <div className="text-xs text-gray-500">
                            {post.score} points • {post.commentCount} comments
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-gray-800">
                          {post.content}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {savedPostsResult.length === 0 ? (
                <div className="text-gray-600">No saved posts yet.</div>
              ) : (
                <div className="space-y-4">
                  {savedPostsResult.map(({ post }) => {
                    const created = post.createdAt
                      ? new Date(post.createdAt).toLocaleString()
                      : "";
                    return (
                      <article
                        key={post.id}
                        className="rounded-xl border bg-white p-4 shadow-sm"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="text-sm text-gray-600">
                            Posted {created}
                          </div>
                          <div className="text-xs text-gray-500">
                            {post.score} points • {post.commentCount} comments
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-gray-800">
                          {post.content}
                        </div>
                        <Link
                          href={`/discussion/${post.id}`}
                          className="mt-2 inline-block text-sm text-sky-700 hover:underline"
                        >
                          View discussion →
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { db } from "~/server/db";
import { profiles, posts } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser } from "~/server/auth";
import { notFound } from "next/navigation";

//This view is only visibile to each user for their own profile, as it contains the special "edit" button that actually
//allows them to edit their own

//Small helper function to get rid of <p> and </p> that show up in post content cards.
function stripPTags(html: string) {
  return html.replace(/^<p>([\s\S]*)<\/p>$/i, '$1');
}


export default async function ProfilePage({params}: {params: Promise <{ profileId: string}>}) {

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
  const {profileId} = await params;

  const isSignedIn = session && (profileId === session.userId ||
        session.user.organizations.some(
          (org) => org.organizationId === profileId && org.role !== "member",
        ))
       

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-xl font-semibold mb-4">You must be signed in</h1>
        <Link href="/" className="rounded-md bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {profile.image ? (
              <img src={profile.image} alt={profile.name} className="w-28 h-28 rounded-full object-cover mb-4" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500 mb-4">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-gray-600 text-sm mb-2">{profile.type}</p>
            {profile.bio && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{profile.bio}</p>}
            <div className="space-y-2 text-sm">
              {profile.linkedin && (
                <p>
                  <strong>LinkedIn:</strong>{" "}
                  <Link href={profile.linkedin} className="text-sky-700 hover:underline" target="_blank">
                    {profile.linkedin}
                  </Link>
                </p>
              )}
              {profile.github && (
                <p>
                  <strong>GitHub:</strong>{" "}
                  <Link href={profile.github} className="text-sky-700 hover:underline" target="_blank">
                    {profile.github}
                  </Link>
                </p>
              )}
              {profile.personalSite && (
                <p>
                  <strong>Personal Site:</strong>{" "}
                  <Link href={profile.personalSite} className="text-sky-700 hover:underline" target="_blank">
                    {profile.personalSite}
                  </Link>
                </p>
              )}
            </div>
            {isSignedIn && (<div className="mt-6">
              <Link href={`/profile/${profileId}/edit`} className="rounded-md bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">
                Edit Profile
              </Link>
            </div>)}
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          {postsResult.length === 0 ? (
            <div className="text-gray-600">No posts yet.</div>
          ) : (
            <div className="space-y-4">
              {postsResult.map((post) => {
                const created = post.createdAt ? new Date(post.createdAt).toLocaleString() : "";
                return (
                  <article key={post.id} className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-gray-600">Posted {created}</div>
                      <div className="text-xs text-gray-500">{post.score} points • {post.commentCount} comments</div>
                    </div>
                    <div
        className="text-gray-800 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: post.content ? stripPTags(post.content) : ""
        }}
      />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

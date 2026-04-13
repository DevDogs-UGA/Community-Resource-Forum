import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "~/components/Avatar";
import Post from "~/components/Post";
import UploadProfilePhoto from "~/components/UploadProfilePhoto";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";
import { hasPermissions } from "~/server/db/permissions";
import { posts, profiles } from "~/server/db/schema/tables";

//This view is only visibile to each user for their own profile, as it contains the special "edit" button that actually
//allows them to edit their own

export default async function ProfilePage({
  params,
}: PageProps<`/profile/[profileId]`>) {
  const { profileId } = await params;

  const result = await db.transaction(async (tx) => {
    const session = await getSession(
      {
        user: {
          with: {
            profile: {
              where: {
                id: profileId,
              },
              with: {
                uploads: true,
                posts: {
                  where: { quarantined: false },
                  orderBy: { score: "desc" },
                  limit: 10,
                  with: {
                    event: true,
                    tags: true,
                    attachments: true,
                    votes: {
                      limit: 1,
                      where: {
                        //?
                      },
                    },
                  },
                },
              },
            },
            organizationPermissions: {
              limit: 1,
              where: {
                organizationProfileId: profileId,
                RAW: hasPermissions("EDIT_PROFILE"),
              },
              with: {
                profile: {
                  with: {
                    uploads: true,
                    posts: {
                      where: { quarantined: false },
                      orderBy: { score: "desc" },
                      limit: 10,
                      with: {
                        event: true,
                        tags: true,
                        attachments: true,
                        votes: {
                          limit: 1,
                          where: {
                            //?
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      tx,
    );

    const profile =
      session &&
      (profileId === session.userProfileId
        ? session.user.profile
        : session.user.organizationPermissions.find(
            (org) => org.organizationProfileId === profileId,
          )?.profile);

    if (profile) {
      return { session, profile, isSignedIn: true } as const;
    }

    return {
      session,
      isSignedIn: false,
      profile: await db.query.profiles.findFirst({
        where: { id: profileId },
        with: {
          posts: {
            where: { quarantined: false },
            orderBy: { score: "desc" },
            limit: 10,
            with: {
              event: true,
              tags: true,
              attachments: true,
              votes: {
                limit: 1,
                where: {
                  userProfileId: session?.userProfileId,
                },
              },
            },
          },
        },
      }),
    } as const;
  });

  if (!result.profile) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="relative text-8xl/0">
              <Avatar {...result.profile} />
            </div>
            {/* {result.isSignedIn ? (
              <UploadProfilePhoto profile={result.profile} />
            ) : (
              <div className="relative text-8xl/0">
                <Avatar {...result.profile} />
              </div>
            )} */}
            <h1 className="text-2xl font-semibold">{result.profile.name}</h1>
            <p className="mb-2 text-sm text-gray-600">{result.profile.type}</p>
            {result.profile.bio && (
              <p className="mb-4 whitespace-pre-wrap text-gray-700">
                {result.profile.bio}
              </p>
            )}
            <div className="space-y-2 text-sm">
              {result.profile.linkedin && (
                <p>
                  <strong>LinkedIn:</strong>{" "}
                  <Link
                    href={result.profile.linkedin}
                    className="text-sky-700 hover:underline"
                    target="_blank"
                  >
                    {result.profile.linkedin}
                  </Link>
                </p>
              )}
              {result.profile.github && (
                <p>
                  <strong>GitHub:</strong>{" "}
                  <Link
                    href={result.profile.github}
                    className="text-sky-700 hover:underline"
                    target="_blank"
                  >
                    {result.profile.github}
                  </Link>
                </p>
              )}
              {result.profile.personalSite && (
                <p>
                  <strong>Personal Site:</strong>{" "}
                  <Link
                    href={result.profile.personalSite}
                    className="text-sky-700 hover:underline"
                    target="_blank"
                  >
                    {result.profile.personalSite}
                  </Link>
                </p>
              )}
            </div>
            {result.isSignedIn && (
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
          <h2 className="mb-4 text-xl font-semibold">Posts</h2>
          {result.profile.posts.length === 0 ? (
            <div className="text-gray-600">No posts yet.</div>
          ) : (
            <div className="space-y-4">
              {result.profile.posts.map(
                ({ attachments, tags, votes, ...post }) => (
                  <div
                    className="overflow-hidden rounded-sm border border-gray-300"
                    key={post.id}
                  >
                    <Post
                      post={post}
                      author={result.profile!}
                      attachments={attachments}
                      tags={tags}
                      vote={votes[0]}
                      tagParam={[]}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

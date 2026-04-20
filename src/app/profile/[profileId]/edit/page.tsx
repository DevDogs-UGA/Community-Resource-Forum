import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import EditInterests from "~/components/EditInterests";
import editProfile from "~/server/actions/editProfile";
import { getUserInterests } from "~/server/actions/interests";
import getAllTags from "~/server/actions/getAllTags";
import { expectSession } from "~/server/auth";
import { hasPermissions } from "~/server/db/permissions";

export default async function EditProfilePage({
  params,
}: PageProps<`/profile/[profileId]`>) {
  const { profileId } = await params;
  const session = await expectSession({
    user: {
      columns: {},
      with: {
        profile: {
          where: {
            id: profileId,
          },
          with: {
            uploads: true,
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
              },
            },
          },
        },
      },
    },
  });

  const profile =
    session.user.profile ?? session.user.organizationPermissions[0]?.profile;

  if (!profile) {
    notFound();
  }

  // Fetch interests and tags (only for user profiles, not orgs)
  const isUserProfile = profile.id === session.userProfileId;
  const [interests, allTags] = isUserProfile
    ? await Promise.all([getUserInterests(), getAllTags()])
    : [[], []];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Edit Profile</h1>
      <form action={editProfile} className="space-y-4">
        <input type="hidden" name="id" defaultValue={profile.id} />
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            defaultValue={profile.name}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={5}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">LinkedIn</label>
          <input
            name="linkedin"
            defaultValue={profile.linkedin ?? ""}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">GitHub</label>
          <input
            name="github"
            defaultValue={profile.github ?? ""}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Personal Site</label>
          <input
            name="personalSite"
            defaultValue={profile.personalSite ?? ""}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Interests Section - only for user profiles */}
        {isUserProfile && (
          <div className="border-t pt-4">
            <EditInterests currentInterests={interests} allTags={allTags} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-sky-700 px-4 py-2 text-white hover:bg-sky-600"
          >
            Save
          </button>
          <Link
            href={`/profile/${profileId}`}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

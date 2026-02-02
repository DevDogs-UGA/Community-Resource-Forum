import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { PiPaperPlaneTiltBold, PiUsersBold } from "react-icons/pi";
import * as z from "zod";
import * as zfd from "zod-form-data";
import PostEditor from "~/components/PostEditor";
import SelectEvent from "~/components/SelectEvent";
import SelectProfile from "~/components/SelectProfile";
import SelectTags from "~/components/SelectTags";
import { expectSessionUser } from "~/server/auth";
import { db } from "~/server/db";
import { posts, tags as tagsTable, tagsToPosts } from "~/server/db/schema";

const schema = zfd.formData({
  authorId: zfd.text(),
  tagId: zfd.repeatableOfType(zfd.text()),
  eventId: zfd.text(z.string().optional()),
  content: zfd.text().transform((s, ctx) => {
    try {
      const obj: unknown = JSON.parse(s);

      if (obj instanceof Array) {
        return new QuillDeltaToHtmlConverter(obj, {}).convert();
      }

      throw new Error("Parsed JSON not instance of array");
    } catch (e) {
      console.error(e);
      ctx.addIssue({ code: "custom", message: "Invalid JSON" });
      return z.NEVER;
    }
  }),
  textContent: zfd.text(),
});

export default async function CreatePost() {
  const tags = await db.select().from(tagsTable).orderBy(asc(tagsTable.lft));

  const session = await expectSessionUser({
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

  async function action(data: FormData) {
    "use server";

    const {
      content,
      tagId: tags,
      authorId,
      eventId,
      textContent,
    } = await schema.parseAsync(data);

    if (
      authorId !== session.userId &&
      !session.user.organizations.some(
        (org) => org.organizationId === authorId && org.role !== "member",
      )
    ) {
      redirect("/sign-in");
    }

    await db.transaction(async (tx) => {
      const [insertedPost] = await tx
        .insert(posts)
        .values({
          authorId,
          eventId,
          content,
          textContent,
        })
        .$returningId();

      if (!insertedPost) {
        tx.rollback();
        return;
      }

      if (tags.length > 0) {
        await tx.insert(tagsToPosts).values(
          tags.map((tagId) => ({
            tagId,
            postId: insertedPost.id,
          })),
        );
      }
    });

    redirect("/");
  }

  const organizationProfiles = session.user.organizations
    .filter((rel) => rel.role === "officer" || rel.role === "owner")
    .map((rel) => rel.organization);

  const events = [session.user.profile, ...organizationProfiles].flatMap(
    (p) => p.events,
  );

  return (
    <form
      action={action}
      className="mx-auto flex flex-col items-center gap-y-6 bg-gray-50 px-8 py-6 pb-24"
    >
      <h1 className="text-2xl font-bold">Create a Post</h1>

      <div className="flex w-full flex-col gap-2">
        <label className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
          <PiUsersBold className="-scale-x-100" /> Post as
        </label>

        <div className="relative -mx-8 bg-gray-200 px-8 py-4">
          <SelectProfile
            inputName="authorId"
            profiles={[session.user.profile, ...organizationProfiles]}
          />
        </div>
      </div>

      <SelectTags tags={tags} />
      <PostEditor />
      <SelectEvent events={events} />

      <button className="flex items-center gap-3 rounded-sm border-b-2 border-sky-900 bg-sky-800 px-6 py-1 text-lg font-medium text-white shadow-sm ring-1 ring-sky-950 transition-colors hover:bg-sky-50 hover:text-sky-800 focus:mt-0.5 focus:border-b-0">
        <span className="contents">
          Publish <PiPaperPlaneTiltBold />
        </span>
      </button>
    </form>
  );
}

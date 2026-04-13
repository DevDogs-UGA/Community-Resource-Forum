"use server";

import { parse } from "date-fns";
import { redirect, unauthorized } from "next/navigation";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import * as z from "zod";
import * as zfd from "zod-form-data";
import { expectSession } from "../auth";
import { db } from "../db";
import Permission, { hasPermissions } from "../db/permissions";
import {
  events,
  eventTags,
  postAttachments,
  posts,
  postTags,
} from "../db/schema/tables";
import { createUpload, type FileDetails } from "../s3";
import { env } from "~/env";

const postSchema = zfd.formData({
  authorId: zfd.text(),
  tags: zfd.repeatableOfType(zfd.text()),
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
  attachments: zfd.repeatableOfType(zfd.text()),
  event: z
    .union([
      z
        .object({
          organizerId: zfd.text(),
          title: zfd.text(),
          rrule: zfd.text(z.string().optional()),
          tags: zfd.repeatableOfType(zfd.text()),
          location: zfd.text(z.string().optional()),
        })
        .and(
          z.union([
            z
              .object({
                startDay: zfd.text(),
                endDay: zfd.text(),
                rrule: zfd.text(z.string().optional()),
                allDay: zfd.checkbox().pipe(z.literal(true)),
              })
              .transform((d) => ({
                allDay: d.allDay,
                start: parse(d.startDay, "yyyy-MM-dd", Date.now()),
                end: parse(d.endDay, "yyyy-MM-dd", Date.now()),
              })),
            z
              .object({
                startDay: zfd.text(),
                startTime: zfd.text(),
                endDay: zfd.text(),
                endTime: zfd.text(),
                allDay: zfd.checkbox().pipe(z.literal(false)),
              })
              .transform((d) => ({
                allDay: d.allDay,
                start: parse(
                  d.startTime,
                  "HH:mm",
                  parse(d.startDay, "yyyy-MM-dd", Date.now()),
                ),
                end: parse(
                  d.endTime,
                  "HH:mm",
                  parse(d.endDay, "yyyy-MM-dd", Date.now()),
                ),
              })),
          ]),
        ),
      z.object({ id: zfd.text(z.string().optional()) }),
    ])
    .optional(),
});

export type CreatePostSchema = z.infer<typeof postSchema>;

export async function createPost(formData: FormData) {
  const session = await expectSession({
    user: {
      columns: {},
      with: {
        organizationPermissions: {
          where: {
            OR: [
              {
                RAW: hasPermissions("CREATE_POSTS"),
              },
              {
                RAW: hasPermissions("CREATE_EVENTS"),
              },
            ],
          },
        },
      },
    },
  });

  const data = await postSchema.parseAsync(formData);

  if (
    (data.authorId !== session.userProfileId &&
      !session.user.organizationPermissions.some(
        (org) =>
          org.organizationProfileId === data.authorId &&
          (org.permissions & Permission.CREATE_POSTS) !== 0,
      )) ||
    (data.event &&
      "organizerId" in data.event &&
      data.event.organizerId !== session.userProfileId &&
      !session.user.organizationPermissions.some(
        (org) =>
          data.event &&
          "organizerId" in data.event &&
          org.organizationProfileId === data.event.organizerId &&
          (org.permissions & Permission.CREATE_EVENTS) !== 0,
      ))
  ) {
    unauthorized();
  }

  const postId = await db.transaction(async (tx) => {
    const eventId =
      data.event && "organizerId" in data.event
        ? (await tx.insert(events).values(data.event).$returningId())[0]?.id
        : data.event?.id;

    if (
      data.event &&
      "organizerId" in data.event &&
      eventId &&
      data.event.tags.length > 0
    ) {
      await tx
        .insert(eventTags)
        .values(data.event.tags.map((tagId) => ({ tagId, eventId })));
    }

    const postId = (
      await tx
        .insert(posts)
        .values({
          authorId: data.authorId,
          content: data.content,
          textContent: data.textContent,
          eventId,
        })
        .$returningId()
    )[0]?.id;

    if (!postId) {
      return tx.rollback();
    }

    if (data.tags.length > 0) {
      await tx
        .insert(postTags)
        .values(data.tags.map((tagId) => ({ tagId, postId })));
    }

    if (data.attachments.length > 0) {
      await tx.insert(postAttachments).values(
        data.attachments.map((contentHash) => ({
          ownerId: data.authorId,
          contentHash,
          postId,
        })),
      );
    }

    return postId;
  });

  redirect(`/discussion/${postId}`);
}

export async function createAttachmentUpload(
  ownerId: string,
  files: FileDetails[],
) {
  const session = await expectSession({
    user: {
      columns: {},
      with: {
        organizationPermissions: {
          columns: {
            organizationProfileId: true,
          },
          where: {
            OR: [
              {
                RAW: hasPermissions("UPLOAD_FILES"),
              },
            ],
          },
        },
      },
    },
  });

  if (
    session.userProfileId !== ownerId &&
    session.user.organizationPermissions.every(
      (org) => org.organizationProfileId !== ownerId,
    )
  ) {
    unauthorized();
  }

  return await createUpload(
    { bucket: env.S3_BUCKET_NAME, ownerId, files },
    (tx) => db.transaction(tx),
  );
}

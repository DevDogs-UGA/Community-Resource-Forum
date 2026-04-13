import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";
import { s3 } from "~/server/s3";

export async function GET(
  _request: NextRequest,
  context: RouteContext<`/uploads/[ownerId]/[contentHash]`>,
) {
  const { ownerId, contentHash } = await context.params;

  const upload = await db.transaction(async (tx) => {
    const session = await getSession(
      {
        user: {
          columns: {},
          with: {
            organizationPermissions: {
              columns: {
                organizationProfileId: true,
                rank: true,
              },
            },
          },
        },
      },
      tx,
    );

    return await tx.query.uploads.findFirst({
      where: {
        OR: [
          { ownerId: session?.userProfileId },
          { attachedProfile: true },
          {
            attachedPost: {
              OR: [
                {
                  accessRank: { isNull: true },
                },
                ...(session?.user.organizationPermissions.map((org) => ({
                  authorId: org.organizationProfileId,
                  accessRank: { gte: org.rank },
                })) ?? []),
              ],
            },
          },
        ],
      },
      columns: { bucket: true, name: true },
    });
  });

  if (!upload) {
    notFound();
  }

  redirect(
    await getSignedUrl(
      //@ts-expect-error Not sure what's causing this, but it could be a library issue?
      s3,
      new GetObjectCommand({
        Bucket: upload.bucket,
        Key: `${ownerId}/${contentHash}`,
        ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(upload.name)}`,
      }),
    ),
  );
}

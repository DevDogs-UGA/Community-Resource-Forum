import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MIMEType } from "whatwg-mimetype";
import { env } from "~/env";
import type { db } from "./db";
import { schema } from "./db/schema";

export const s3 = new S3Client({
  endpoint: `${env.S3_HOST.includes("localhost") ? "http" : "https"}://${env.S3_HOST}:${env.S3_PORT}`,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export function isAllowedType(mimeType: string, allowedMimeTypes: string[]) {
  const { type, subtype } = new MIMEType(mimeType);
  return allowedMimeTypes
    .map((allowed) => new MIMEType(allowed))
    .some(
      (allowed) =>
        (allowed.type === "*" || allowed.type === type) &&
        (allowed.subtype === "*" || allowed.type === subtype),
    );
}

export interface FileDetails {
  name: string;
  size: number;
  type: string;
  ownerId: string;
  contentHash: string;
}

export type UploadResult = (FileDetails & {
  presignedUrl: string;
})[];

export interface Upload {
  bucket: string;
  ownerId: string;
  files: FileDetails[];
}

export async function createUpload(
  { bucket, ownerId, files }: Upload,
  createTransaction: typeof db.transaction,
) {
  return createTransaction(async (tx) => {
    if (files.length === 0) {
      return [];
    }

    await tx.insert(schema.uploads).values(
      files.map((file) => ({
        ...file,
        ownerId: ownerId,
        bucket: bucket,
      })),
    );

    return (await Promise.all(
      files.map(async (file) => ({
        ...file,
        presignedUrl: await getSignedUrl(
          //@ts-expect-error Not sure what's causing this, but it could be a library issue?
          s3,
          new PutObjectCommand({
            Bucket: bucket,
            ContentType: file.type,
            ContentLength: file.size,
            ChecksumSHA256: file.contentHash,
            Key: `${ownerId}/${file.contentHash}`,
          }),
        ),
      })),
    ).catch((error) => {
      console.error(error);
      return tx.rollback();
    })) satisfies UploadResult;
  });
}

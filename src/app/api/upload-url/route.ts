import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// 👇 This automatically works with LocalStack or AWS
const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT ?? "http://localhost:4566", // LocalStack default
  forcePathStyle: true, // Required for LocalStack
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
  },
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");
  const filetype = searchParams.get("filetype");

  if (!filename || !filetype) {
    return NextResponse.json({ error: "Missing filename or filetype" }, { status: 400 });
  }

  const bucket = process.env.AWS_S3_BUCKET ?? "local-bucket";
  const key = `posts/${Date.now()}-${filename}`;

  // Ensure bucket exists and has permissive CORS for browser-based PUT uploads (useful for LocalStack)
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err) {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (createErr) {
      console.warn("Create bucket failed (may already exist):", createErr);
    }

    try {
      // Set a permissive CORS policy to allow PUT from the dev origin
      const corsRules = {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
            AllowedOrigins: ["*"],
            MaxAgeSeconds: 3000,
          },
        ],
      };

      await s3.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: corsRules } as any));
    } catch (corsErr) {
      console.warn("PutBucketCors failed:", corsErr);
    }
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: filetype,
  });

  try {
    const uploadUrl = await getSignedUrl(s3 as any, command as any, { expiresIn: 60 });
    const fileUrl = `http://localhost:4566/${bucket}/${key}`; // LocalStack uses this pattern

    return NextResponse.json({ uploadUrl, fileUrl });
  } catch (err) {
    console.error("S3 signing error:", err);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}

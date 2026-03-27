import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const bucket = process.env.AWS_S3_BUCKET ?? "";
const cdnBase = process.env.CLOUDFRONT_URL ?? `https://${bucket}.s3.${process.env.AWS_REGION ?? "ap-southeast-2"}.amazonaws.com`;

export async function getPresignedUploadUrl(
  s3Key: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    throw new Error("S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.");
  }
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `${cdnBase}/${s3Key}`;

  return { uploadUrl, publicUrl };
}

export async function uploadToS3(): Promise<string> {
  // Server-side upload is not yet implemented.
  // Use the presigned URL flow (getPresignedUploadUrl) for all client uploads.
  throw new Error("Server-side S3 upload is not available. Use the presigned URL flow.");
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function getS3KeyFromUrl(url: string): string {
  return url.replace(cdnBase + "/", "");
}

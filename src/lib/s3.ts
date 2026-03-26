// S3 upload utilities — requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
// AWS_REGION, S3_BUCKET_NAME, CLOUDFRONT_URL env vars

export async function uploadToS3(
  _buffer: Buffer,
  _key: string,
  _contentType: string
): Promise<string> {
  // TODO: Implement S3 upload using @aws-sdk/client-s3
  // Returns the CloudFront CDN URL of the uploaded file
  throw new Error("S3 upload not yet implemented");
}

export async function deleteFromS3(_key: string): Promise<void> {
  // TODO: Implement S3 deletion
  throw new Error("S3 delete not yet implemented");
}

export function getS3KeyFromUrl(url: string): string {
  const cloudfrontUrl = process.env.CLOUDFRONT_URL ?? "";
  return url.replace(cloudfrontUrl + "/", "");
}

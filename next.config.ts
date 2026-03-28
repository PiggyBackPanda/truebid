import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // CloudFront CDN (production)
      { protocol: "https", hostname: "*.cloudfront.net" },
      // S3 direct (development / presigned URLs)
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      // Unsplash (fallback images for listings without photos + hero)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
};

export default nextConfig;

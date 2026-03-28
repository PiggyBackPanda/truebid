"use client";

import Image from "next/image";
import { useState } from "react";

import { getListingFallbackImage } from "@/lib/listing-images";

export { getListingFallbackImage };

const DEFAULT_FALLBACK = getListingFallbackImage("default");

interface PropertyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function PropertyImage({ src, alt, className, priority }: PropertyImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || DEFAULT_FALLBACK);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={className}
      priority={priority}
      onError={() => setImgSrc(DEFAULT_FALLBACK)}
    />
  );
}

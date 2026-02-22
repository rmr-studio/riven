import type { ImageLoaderProps } from "next/image";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL ?? "";

export const cdnImageLoader = ({ src }: ImageLoaderProps): string =>
  `${CDN_URL}/${src}`;

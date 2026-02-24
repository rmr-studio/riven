import type { ImageLoaderProps } from "next/image";

const CDN_URL = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/+$/, "");

export const getCdnUrl = (path: string): string => `${CDN_URL}/${path}`;

export const cdnImageLoader = ({ src }: ImageLoaderProps): string =>
  getCdnUrl(src);

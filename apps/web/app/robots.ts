import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: ["GPTBot", "CCBot", "Google-Extended", "anthropic-ai"],
        disallow: "/",
      },
    ],
    sitemap: "https://getriven.io/sitemap.xml",
  };
}

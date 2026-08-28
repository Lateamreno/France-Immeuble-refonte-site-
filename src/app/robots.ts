import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * robots.txt.
 *
 * `/api/` est bloqué : ce sont des route handlers, jamais des pages. Les URLs
 * en `noindex` ne sont pas listées ici — le `noindex` de la page suffit, et
 * une interdiction de crawl empêcherait Google de le lire.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}

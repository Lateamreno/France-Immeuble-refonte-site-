import { SITE } from "@/lib/site";
import { tousLesArticles } from "@/lib/contenu";

/**
 * /feed/ — le flux RSS des articles, à l'adresse qu'avait l'ancien WordPress (lot 77,
 * MAV, 04/11/2026 : aucune adresse existante ne doit casser à la bascule). Les lecteurs
 * de flux et agrégateurs abonnés continuent de recevoir les articles.
 */
export const dynamic = "force-static";

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const articles = [...tousLesArticles()].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const items = articles.map((a) => {
    const url = `${SITE.url}${a.chemin}`;
    return `<item><title>${xml(a.h1)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>` +
      (a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : "") +
      (a.seoDesc ? `<description>${xml(a.seoDesc)}</description>` : "") + `</item>`;
  }).join("");
  const derniere = articles[0]?.updatedAt ?? articles[0]?.publishedAt;
  const corps = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>France Immeuble</title><link>${SITE.url}/blog/</link>
<atom:link href="${SITE.url}/feed/" rel="self" type="application/rss+xml"/>
<description>Conseils pour vendre, estimer et acheter un immeuble de rapport.</description>
<language>fr-FR</language>${derniere ? `<lastBuildDate>${new Date(derniere).toUTCString()}</lastBuildDate>` : ""}
${items}
</channel></rss>`;
  return new Response(corps, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

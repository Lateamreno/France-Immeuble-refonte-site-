import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { tousLesArticles } from "@/lib/contenu";

/**
 * Sitemap.
 *
 * Les pages en `noindex` en sont exclues : les y laisser envoie à Google un
 * signal contradictoire. Les articles sont servis à la racine, pas sous
 * /blog/ (CLAUDE.md §10) — leur chemin vient de la source de contenu, jamais
 * d'une concaténation de préfixe.
 */
type Entree = { chemin: string; priorite: number; frequence: MetadataRoute.Sitemap[0]["changeFrequency"] };

const PAGES: Entree[] = [
  { chemin: "/", priorite: 1.0, frequence: "weekly" },
  { chemin: "/vendre-un-immeuble/", priorite: 0.9, frequence: "monthly" },
  { chemin: "/estimer-un-immeuble/", priorite: 0.9, frequence: "monthly" },
  { chemin: "/vendre-a-la-decoupe/", priorite: 0.8, frequence: "monthly" },
  { chemin: "/acheter-un-immeuble/", priorite: 0.8, frequence: "monthly" },
  { chemin: "/immeubles-vendus/", priorite: 0.7, frequence: "weekly" },
  { chemin: "/blog/", priorite: 0.6, frequence: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();

  const pages = PAGES.map((p) => ({
    url: `${SITE.url}${p.chemin}`,
    lastModified: maintenant,
    changeFrequency: p.frequence,
    priority: p.priorite,
  }));

  const articles = tousLesArticles()
    .filter((a) => !a.noindex)
    .map((a) => ({
      url: `${SITE.url}${a.chemin}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));

  return [...pages, ...articles];
}

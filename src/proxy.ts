import { NextResponse, type NextRequest } from "next/server";
import MEDIAS from "@/lib/medias-wp.json";

/**
 * Rafraîchit la session du compte avant la page ou la route qui la lit.
 *
 * Une page serveur ne peut pas poser de cookie : si le jeton d'accès expire
 * (au bout d'une heure), c'est ici qu'on l'échange contre un neuf avec le
 * jeton de rafraîchissement, et qu'on transmet les deux cookies à la fois à
 * la requête (pour la page) et à la réponse (pour le navigateur).
 *
 * Ne tourne que sur les chemins du compte et des formulaires : le reste du
 * site ne lit aucune session et reste servi en statique.
 */

const AT = "fi_at";
const RT = "fi_rt";

function expiration(jeton: string): number {
  try {
    const b64 = jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return Number(JSON.parse(atob(b64)).exp) || 0;
  } catch {
    return 0;
  }
}

const options = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

/** Liens courts de l'ancien WordPress (?p= et ?page_id=), d'après l'inventaire du §10 de CLAUDE.md. */
const IDS_WP: Record<string, string> = {
  "6": "/", "9": "/blog/", "964": "/contactez-nous/", "997": "/estimer-un-immeuble/",
  "1428": "/immeubles-vendus/", "1232": "/mentions-legales-2/", "1461": "/plan-du-site/",
  "1081": "/vendre-un-immeuble/",
  "2095": "/comment-choisir-agence-immobiliere-pour-vendre-immeuble/",
  "1208": "/comment-estimer-un-immeuble-de-rapport/",
  "1195": "/comment-vendre-plus-cher-a-un-promoteur/",
  "2003": "/comment-vendre-un-immeuble-a-paris/",
  "1217": "/comment-vendre-un-immeuble-de-rapport/",
  "1976": "/comment-vendre-un-immeuble-plus-cher/",
  "1179": "/delegation-de-mandat-pourquoi-y-recourir/",
  "1211": "/droit-de-preemption-lors-de-la-vente-dun-immeuble-en-bloc/",
  "1171": "/immeuble-dhabitation-ou-immeuble-de-bureaux/",
  "1214": "/immeuble-insalubre-ou-en-etat-de-peril-que-faire/",
  "1183": "/immobilier-off-market-tout-ce-quil-faut-savoir/",
  "2013": "/impact-de-la-hausse-des-taux-sur-les-immeubles-en-bloc/",
  "1204": "/pourquoi-acheter-un-immeuble-en-bloc/",
  "2126": "/vendre-un-immeuble-avec-un-mauvais-dpe/",
};

/**
 * Une image de l'ancien WordPress (/wp-content/uploads/AAAA/MM/nom-1024x683.jpg) vers sa
 * copie sur le site (/media/nom.webp) : on cherche le nom, puis le nom sans sa taille
 * (-1024x683), sans « -scaled » et sans suffixe de doublon (-1). Rien trouvé : 404.
 */
function imageWp(chemin: string): string | null {
  const nom = decodeURIComponent(chemin.split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  const table = MEDIAS as Record<string, string>;
  let n = nom;
  for (let i = 0; i < 5; i++) {
    if (table[n]) return table[n];
    const suivant = n.replace(/(-\d+x\d+|-scaled|-\d)$/, "");
    if (suivant === n) break;
    n = suivant;
  }
  return null;
}

/** Les PDF de l'ancien site encore connus de Google, vers la page qui les remplace. */
const DOCUMENTS_WP: Record<string, string> = {
  // Le barème est une page depuis le 09/11/2026 (MAV).
  "tarifs-2020.pdf": "/nos-honoraires/",
  "tarifs-2022.pdf": "/nos-honoraires/",
  "cgu-france-immeuble-27112018-1.pdf": "/mentions-legales-2/",
};

function redirection(req: NextRequest, chemin: string) {
  // Une URL absolue : la barre finale de /vendre-un-immeuble/ reste (sinon une redirection de plus).
  return NextResponse.redirect(new URL(chemin, req.nextUrl.origin), 301);
}

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname.startsWith("/wp-content/")) {
    const cible = imageWp(pathname) ?? DOCUMENTS_WP[pathname.split("/").pop()?.toLowerCase() ?? ""];
    if (cible) return redirection(req, cible);
    // Search Console, 05/11/2026 : un ancien fichier sans équivalent est « parti »
    // (410) plutôt que refusé, pour que Google l'oublie vite.
    return new NextResponse("Ce document n’existe plus.", { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (pathname === "/") {
    const id = searchParams.get("p") ?? searchParams.get("page_id");
    const cible = id ? IDS_WP[id] : undefined;
    return cible ? redirection(req, cible) : NextResponse.next();
  }

  const at = req.cookies.get(AT)?.value;
  const rt = req.cookies.get(RT)?.value;
  if (!rt) return NextResponse.next();
  if (at && expiration(at) > Date.now() / 1000 + 60) return NextResponse.next();

  const url = process.env.SITE_SUPABASE_URL?.replace(/\/+$/, "");
  const cle = process.env.SITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !cle) return NextResponse.next();

  try {
    const r = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: cle, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const s = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number };
      req.cookies.set(AT, s.access_token);
      req.cookies.set(RT, s.refresh_token);
      const res = NextResponse.next({ request: req });
      res.cookies.set(AT, s.access_token, options(s.expires_in || 3600));
      res.cookies.set(RT, s.refresh_token, options(60 * 60 * 24 * 30));
      return res;
    }
    // Jeton de rafraîchissement refusé (révoqué, expiré) : la session est finie.
    if (r.status >= 400 && r.status < 500) {
      req.cookies.delete(AT);
      req.cookies.delete(RT);
      const res = NextResponse.next({ request: req });
      res.cookies.delete(AT);
      res.cookies.delete(RT);
      return res;
    }
  } catch {
    /* Auth injoignable : on laisse passer, la page affichera « reconnectez-vous ». */
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mon-compte/:path*", "/api/compte/:path*", "/api/lead/:path*",
    // Ancien WordPress : images et liens courts (lot 77).
    "/wp-content/:path*",
    { source: "/", has: [{ type: "query", key: "p" }] },
    { source: "/", has: [{ type: "query", key: "page_id" }] },
  ],
};

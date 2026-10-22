import { NextResponse, type NextRequest } from "next/server";

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

export async function proxy(req: NextRequest) {
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
  matcher: ["/mon-compte/:path*", "/api/compte/:path*", "/api/lead/:path*"],
};

import { NextResponse } from "next/server";
import { COOKIE_EQUIPE } from "@/lib/stats-annonces";

/**
 * Exclut ce navigateur des statistiques des annonces (contrat du BO §19, lot 141) : chaque membre de
 * l'équipe ouvre une fois https://www.france-immeuble.fr/api/stats/equipe/ sur son ordinateur et son
 * téléphone. `?retirer=1` le compte de nouveau. Le cookie ne contient que « 1 » et ne sert qu'à ça.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const retirer = new URL(req.url).searchParams.get("retirer") === "1";
  const message = retirer
    ? "Les visites de ce navigateur comptent de nouveau dans les statistiques des annonces."
    : "C’est noté : les visites de ce navigateur ne comptent plus dans les statistiques des annonces. À refaire sur chaque navigateur et chaque téléphone de l’équipe.";
  const res = new NextResponse(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Statistiques des annonces</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0A0A0A;color:#EFE9DE;font:16px/1.5 system-ui,sans-serif;padding:24px"><p style="max-width:42ch">${message}</p></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );
  res.cookies.set(COOKIE_EQUIPE, retirer ? "" : "1", {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: retirer ? 0 : 60 * 60 * 24 * 400,
  });
  return res;
}

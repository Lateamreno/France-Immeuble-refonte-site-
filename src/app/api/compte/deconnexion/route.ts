import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_AT, deconnecterServeur, effacerSession } from "@/lib/compte/auth";
import { memeOrigine, refus } from "@/lib/compte/requete";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const jeton = (await cookies()).get(COOKIE_AT)?.value;
  if (jeton) await deconnecterServeur(jeton);
  await effacerSession();
  return NextResponse.json({ ok: true });
}

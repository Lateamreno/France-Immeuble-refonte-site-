import { NextResponse } from "next/server";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { ErreurAuth, modifierCompte, type ChangementEmail } from "@/lib/compte/auth";
import { deposerLead } from "@/lib/leads";
import { envoyerAuClient } from "@/lib/notifications";
import { codeNouvelleAdresse, adresseChangee } from "@/lib/compte/courriels";
import { contexteDe, EMAIL, erreurEnReponse, exigerCompte, lireJson, refus, texte } from "@/lib/compte/requete";

export const runtime = "nodejs";

const QUART_D_HEURE = 15 * 60_000;
const empreinte = (id: string, code: string) => createHash("sha256").update(`${id}|${code}`).digest("hex");

/**
 * Changer son adresse e-mail (MAV, 30/10/2026). L'adresse reste celle qui
 * ouvre le compte : la nouvelle n'est retenue qu'avec le code envoyé à cette
 * nouvelle adresse. L'ancienne adresse est prévenue du changement.
 *
 * `action: "code"` : envoie un code à 6 chiffres (5 envois par 24 h au plus).
 * `action: "verifier"` : 5 essais par code, valable 15 minutes.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");
  const u = s.utilisateur;
  const enCours = (u.app_metadata?.nouvel_email ?? null) as ChangementEmail | null;

  try {
    if (b.action === "code") {
      const email = texte(b.email, 200).toLowerCase();
      if (!EMAIL.test(email)) return refus("Cette adresse e-mail n’est pas lisible.", 422);
      if (email === u.email.toLowerCase()) return refus("C’est déjà votre adresse.", 422);
      const envois = (enCours?.envois ?? []).filter((t) => t > Date.now() - 86_400_000);
      if (envois.length >= 5) return refus("Trop de codes demandés aujourd’hui. Réessayez demain.", 429);
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const attente: ChangementEmail = { email, empreinte: empreinte(u.id, code), expire: Date.now() + QUART_D_HEURE, essais: 0, envois: [...envois, Date.now()] };
      await modifierCompte(u.id, { app_metadata: { nouvel_email: attente } });
      const c = codeNouvelleAdresse(code);
      if (!(await envoyerAuClient({ a: email, sujet: c.sujet, html: c.html, text: c.text }))) {
        return refus("L’e-mail n’a pas pu partir. Réessayez dans un instant.", 503);
      }
      return NextResponse.json({ ok: true });
    }

    if (b.action === "verifier") {
      const code = texte(b.code, 6).replace(/\D/g, "");
      if (!enCours || enCours.expire < Date.now()) return refus("Ce code a expiré. Demandez-en un nouveau.", 422);
      if (enCours.essais >= 5) return refus("Trop d’essais. Demandez un nouveau code.", 429);
      const attendu = Buffer.from(enCours.empreinte, "hex");
      const recu = Buffer.from(empreinte(u.id, code), "hex");
      if (code.length !== 6 || !timingSafeEqual(attendu, recu)) {
        await modifierCompte(u.id, { app_metadata: { nouvel_email: { ...enCours, essais: enCours.essais + 1 } } });
        return refus("Ce code n’est pas le bon.", 422);
      }
      const ancienne = u.email;
      const maj = await modifierCompte(u.id, { email: enCours.email, app_metadata: { nouvel_email: null } });
      const c = adresseChangee(enCours.email);
      await envoyerAuClient({ a: ancienne, sujet: c.sujet, html: c.html, text: c.text });
      await deposerLead(
        { type: "coordonnees", ref: crypto.randomUUID(), compte: u.id, email: enCours.email, ancien_email: ancienne,
          prenom: u.user_metadata?.prenom, nom: u.user_metadata?.nom, telephone: u.user_metadata?.telephone },
        { contexte: contexteDe(maj) },
      );
      return NextResponse.json({ ok: true, email: enCours.email });
    }
    return refus("Requête illisible.");
  } catch (e) {
    if (e instanceof ErreurAuth && ["email_exists", "user_already_exists", "422"].includes(e.code)) {
      return refus("Un autre compte utilise déjà cette adresse.", 409);
    }
    return erreurEnReponse(e);
  }
}

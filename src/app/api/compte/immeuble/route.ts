import { NextResponse } from "next/server";
import { uuidDe, type Connecte } from "@/lib/compte/auth";
import { donneesCompte } from "@/lib/compte/donnees";
import { type CopieEstimation } from "@/lib/compte/immeubles";
import { contexteDe, erreurEnReponse, exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";
import { fusionnerSaisie, saisieDuCompte } from "@/lib/compte/saisies";
import { deposerLead } from "@/lib/leads";
import { nettoyer, pourBO, type Dossier } from "@/lib/dossier/modele";
import { dossierRempli, empreinteDossier, PAS_TRANSMISSION } from "@/lib/dossier/envoi";

export const runtime = "nodejs";

/**
 * L'état locatif d'un immeuble du compte (retours #261, #277, MAV, 05/11/2026).
 *
 * `cle` désigne l'immeuble tel que le client le voit dans « Mes immeubles » :
 * la `ref` d'une estimation qu'il a envoyée, ou la clé d'un immeuble déposé
 * par le BO. Le serveur vérifie que l'un ou l'autre appartient au compte,
 * puis garde le brouillon dans la copie de l'estimation (`compte_saisies`).
 *
 * PUT : brouillon, au fil de la saisie, déposé aussi au BO avec `enCours: true`
 * (retour #266) : toutes les 45 s au plus, tout de suite quand la page se
 * ferme ou sur « Enregistrer » (`maintenant`). POST : envoi au BO, comme un
 * troisième envoi de l'estimation (`etat: "dossier"`, même `ref`), avec
 * `bien` quand l'immeuble est déjà au BO, et l'alerte de l'agence.
 */
async function immeuble(s: Connecte, cle: string): Promise<{ ref: string; bien?: string; c: CopieEstimation } | null> {
  if (!UUID.test(cle)) return null;
  const propre = await saisieDuCompte(s.utilisateur.id, cle, "estimation");
  if (propre) return { ref: cle, c: propre.donnees as CopieEstimation };
  const d = await donneesCompte(s.jeton);
  const b = d.biens.find((x) => x.cle === cle);
  if (!b) return null;
  const ref = b.ref && UUID.test(b.ref) ? b.ref : uuidDe(`etat-locatif|${b.cle}`);
  const lie = await saisieDuCompte(s.utilisateur.id, ref, "estimation");
  return { ref, bien: b.cle, c: { ...((lie?.donnees as CopieEstimation) ?? {}), bien: b.cle } };
}

async function lire(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return { erreur: s };
  const b = await lireJson(req, 80_000);
  if (!b) return { erreur: refus("Requête illisible.") };
  const i = await immeuble(s, texte(b.cle, 36));
  if (!i) return { erreur: refus("Immeuble introuvable.", 404) };
  return { s, b, i };
}

function leadDossier(s: Connecte, i: { ref: string; bien?: string; c: CopieEstimation }, dossier: Dossier) {
  const u = s.utilisateur;
  return {
    type: "estimation",
    etat: "dossier",
    ref: i.ref,
    ...(i.bien ? { bien: i.bien } : {}),
    compte: u.id,
    formulaire: i.c.formulaire || "compte",
    prenom: u.user_metadata?.prenom ?? "",
    nom: u.user_metadata?.nom ?? "",
    telephone: u.user_metadata?.telephone ?? "",
    email: u.email,
    rue: i.c.rue ?? "",
    codePostal: i.c.codePostal ?? "",
    ville: i.c.ville ?? "",
    ...pourBO(dossier),
    recuLe: new Date().toISOString(),
  };
}

export async function PUT(req: Request) {
  try {
    const r = await lire(req);
    if ("erreur" in r) return r.erreur;
    const { s, b, i } = r;
    const dossier = nettoyer(b.donnees);
    let transmis: { dossier_transmis_le: string; dossier_transmis_empreinte: string } | null = null;
    const empreinte = empreinteDossier(dossier);
    const dernier = i.c.dossier_transmis_le;
    if (dossierRempli(dossier) && empreinte !== i.c.dossier_transmis_empreinte &&
        (b.maintenant === true || !dernier || Date.now() - Date.parse(dernier) >= PAS_TRANSMISSION)) {
      const issue = await deposerLead({ ...leadDossier(s, i, dossier), enCours: true }, { silencieux: true });
      if (issue === "bo" || issue === "file") {
        transmis = { dossier_transmis_le: new Date().toISOString(), dossier_transmis_empreinte: empreinte };
      }
    }
    const ok = await fusionnerSaisie(s.utilisateur.id, i.ref, "estimation", {
      dossier, ...(i.bien ? { bien: i.bien } : {}), ...(transmis ?? {}),
    });
    return ok
      ? NextResponse.json({ ok: true, transmis_le: transmis?.dossier_transmis_le ?? dernier ?? null })
      : refus("Enregistrement impossible pour l’instant.", 503);
  } catch (e) {
    return erreurEnReponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const r = await lire(req);
    if ("erreur" in r) return r.erreur;
    const { s, b, i } = r;
    const dossier = nettoyer(b.donnees);
    const u = s.utilisateur;
    const issue = await deposerLead(leadDossier(s, i, dossier), { contexte: contexteDe(u) });
    if (issue === "perdu") return refus("Votre état locatif n’a pas pu partir. Réessayez dans un instant, ou appelez-nous.", 503);
    const envoye_le = new Date().toISOString();
    await fusionnerSaisie(u.id, i.ref, "estimation", {
      dossier, dossier_envoye_le: envoye_le, dossier_transmis_le: envoye_le, dossier_transmis_empreinte: empreinteDossier(dossier),
      ...(i.bien ? { bien: i.bien } : {}),
    });
    return NextResponse.json({ ok: true, envoye_le });
  } catch (e) {
    return erreurEnReponse(e);
  }
}

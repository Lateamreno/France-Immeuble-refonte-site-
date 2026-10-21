"use client";

import { useId, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { SITE } from "@/lib/site";

/**
 * Formulaire de contact — repris du WordPress.
 *
 * Champs et libellés identiques à l'original (téléphone, projet, message), y
 * compris les trois intitulés du menu déroulant, repris au mot près.
 *
 * L'original découpait la saisie en deux écrans : le téléphone d'abord, le
 * projet et le message ensuite. On garde les mêmes champs sur UN seul écran,
 * conformément à la règle retenue pour le tunnel d'estimation : le visiteur ne
 * doit jamais voir d'étapes.
 */
const PROJETS = [
  "Je souhaite acheter un immeuble",
  "Je souhaite vendre un immeuble",
  "Je souhaite travailler en interagence",
] as const;

/**
 * `bien` : posé depuis une fiche « à vendre ». Le projet est pré-rempli et la
 * référence du bien part avec le lead — l'agent sait de quel immeuble on parle
 * sans avoir à le demander.
 */
export function ContactForm({ bien }: { bien?: { ref: string; titre: string } } = {}) {
  const uid = useId();
  const [telephone, setTelephone] = useState("");
  const [projet, setProjet] = useState<string>(bien ? PROJETS[0] : "");
  const [message, setMessage] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    // L'original imposait exactement 10 chiffres : on garde la règle.
    if (!/^\d{10}$/.test(telephone.replace(/\D/g, ""))) {
      e.telephone = "Veuillez entrer un numéro de téléphone à 10 chiffres.";
    }
    if (!projet) e.projet = "Veuillez sélectionner une option.";
    setErreurs(e);
    if (Object.keys(e).length > 0) return;

    setEnvoi(true);
    try {
      await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          telephone,
          projet,
          message,
          ...(bien ? { bien: bien.ref, bienTitre: bien.titre } : {}),
        }),
      });
    } catch {
      // Jamais d'échec affiché : le handler serveur trace et alerte.
    }
    type DL = { push: (o: Record<string, unknown>) => void };
    (window as unknown as { dataLayer?: DL }).dataLayer?.push({ event: "form_submit_contact" });
    setEnvoi(false);
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge">Message envoyé</span>
        {/* Message de succès repris mot pour mot de l'original. */}
        <h3>Nous vous remercions pour votre message</h3>
        <p>Nous vous rappelons au plus vite.</p>
        <div className="btn-row">
          <a className="btn btn--outline" href={SITE.telHref}>
            Nous joindre directement · {SITE.tel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="form-shell" onSubmit={envoyer} noValidate>
      <div className="fields">
        <div className="field">
          <label htmlFor={`${uid}-tel`}>Entrez votre numéro de téléphone</label>
          <input
            id={`${uid}-tel`}
            type="tel"
            value={telephone}
            onChange={(e) => {
              setTelephone(e.target.value);
              setErreurs((p) => ({ ...p, telephone: "" }));
            }}
            inputMode="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
          />
          {erreurs.telephone && <span className="err">{erreurs.telephone}</span>}
        </div>

        <div className="field">
          <label htmlFor={`${uid}-projet`}>Votre projet</label>
          <select
            id={`${uid}-projet`}
            value={projet}
            onChange={(e) => {
              setProjet(e.target.value);
              setErreurs((p) => ({ ...p, projet: "" }));
            }}
          >
            <option value="" disabled>
              Veuillez sélectionner une option
            </option>
            {PROJETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {erreurs.projet && <span className="err">{erreurs.projet}</span>}
        </div>

        <div className="field">
          <label htmlFor={`${uid}-msg`}>Votre message :</label>
          <textarea
            id={`${uid}-msg`}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Entrez votre message"
          />
        </div>
      </div>

      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Envoi…" : "Envoyer"} {!envoi && <ArrowIcon />}
        </button>
      </div>
    </form>
  );
}

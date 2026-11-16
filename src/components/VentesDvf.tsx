"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreditPhoto,
  EVT_OUVRIR,
  LotsVente,
  NBSP,
  PhotoVente,
  chargerVentes,
  surVentes,
  euros,
  locauxDe,
  moisAnnee,
  moisCourt,
  pourcent,
  type Vente,
} from "./ventes-dvf/commun";

/**
 * Les ventes d'immeubles d'un arrondissement, en liste (lot 127, MAV, 16/11/2026 : « c'est peut-être
 * pas pratique sous forme de cartes à lire, j'aurais préféré sous forme de liste »). Une ligne par
 * vente : date, rue, type, logements, surface, prix, prix au m², rendement ; un clic déplie la photo
 * de la façade et les lots. Les ventes arrivent de `/api/ventes-dvf/`, fermée aux robots (conditions
 * de DVF) ; `data-nosnippet` en plus : aucun extrait de ces lignes dans les résultats de Google.
 */
type Tri = "date" | "prix" | "prixM2" | "rendement";
const TRIS: { cle: Tri; libelle: string }[] = [
  { cle: "date", libelle: "Date" },
  { cle: "prix", libelle: "Prix" },
  { cle: "prixM2", libelle: "Prix au m²" },
  { cle: "rendement", libelle: "Rendement" },
];
/** Les ventes montrées d'abord ; les autres derrière un bouton. */
const D_ABORD = 8;

function trier(ventes: Vente[], tri: Tri): Vente[] {
  const v = [...ventes];
  if (tri === "date") return v.sort((a, b) => b.date.localeCompare(a.date));
  if (tri === "rendement") return v.sort((a, b) => (b.rendement ?? -1) - (a.rendement ?? -1));
  return v.sort((a, b) => b[tri] - a[tri]);
}

function Ligne({ v, ouverte, basculer }: { v: Vente; ouverte: boolean; basculer: () => void }) {
  const locaux = locauxDe(v);
  const panneau = `vdvf-d-${v.id}`;
  return (
    <li id={`v-${v.id}`} className={`vdvf-ligne${ouverte ? " is-ouverte" : ""}`}>
      <button type="button" className="vdvf-ligne__tete" aria-expanded={ouverte} aria-controls={panneau} onClick={basculer}>
        <span className="vdvf-c vdvf-c--date">{moisCourt(v.date)}</span>
        <span className="vdvf-c vdvf-c--rue">{v.rue ?? "Rue non renseignée"}</span>
        <span className="vdvf-c vdvf-c--type">{v.mixte ? "Mixte" : "Habitation"}</span>
        <span className="vdvf-c vdvf-c--lots">
          {v.logements}
          {NBSP}log.{locaux ? ` + ${locaux}${NBSP}com.` : ""}
        </span>
        <span className="vdvf-c vdvf-c--surf">
          {v.surface.toLocaleString("fr-FR")}
          {NBSP}m²
        </span>
        <span className="vdvf-c vdvf-c--prix">{euros(v.prix)}</span>
        <span className="vdvf-c vdvf-c--m2">{euros(v.prixM2)}</span>
        <span className="vdvf-c vdvf-c--rdt">{v.rendement != null ? pourcent(v.rendement) : "–"}</span>
        <span className="vdvf-ligne__fleche" aria-hidden="true" />
      </button>
      {ouverte && (
        <div id={panneau} className="vdvf-ligne__detail">
          <PhotoVente v={v} />
          <div className="vdvf-ligne__texte">
            <p className="vdvf__date">
              {moisAnnee(v.date)} · {v.mixte ? "Immeuble mixte" : "Immeuble d’habitation"}
            </p>
            <p className="vdvf__chiffres">
              {euros(v.prix)} · {euros(v.prixM2)} le m² · {v.surface.toLocaleString("fr-FR")}
              {NBSP}m²
              {v.rendement != null && <> · rendement théorique {pourcent(v.rendement)}</>}
            </p>
            <p className="vdvf__sous-titre">
              {v.logements} logement{v.logements > 1 ? "s" : ""}
              {locaux ? ` et ${locaux} ${locaux > 1 ? "locaux commerciaux" : "local commercial"}` : ""}
            </p>
            <LotsVente v={v} />
            {v.photo && <CreditPhoto photo={v.photo} />}
          </div>
        </div>
      )}
    </li>
  );
}

export function VentesDvf({ code, nom }: { code: string; nom: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [toutes, setToutes] = useState<Vente[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [tout, setTout] = useState(false);
  const [tri, setTri] = useState<Tri>("date");
  const [ouverte, setOuverte] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let fini = false;
    const charger = () => {
      if (fini) return;
      fini = true;
      chargerVentes()
        .then((v) => setToutes(v))
        .catch(() => setErreur(true));
    };
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (charger(), io.disconnect()), { rootMargin: "1200px 0px" });
    io.observe(el);
    // Chargées par une autre liste ou par la carte : on les affiche aussi, toutes ensemble.
    const fin = surVentes((v) => {
      fini = true;
      io.disconnect();
      setToutes(v);
    });
    return () => {
      io.disconnect();
      fin();
    };
  }, []);

  const ventes = useMemo(() => (toutes ? trier(toutes.filter((v) => v.codeInsee === code), tri) : null), [toutes, code, tri]);

  // Une vente choisie sur la carte : la liste se déplie sur elle.
  useEffect(() => {
    const ouvrir = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      chargerVentes().then((v) => {
        const vente = v.find((x) => x.id === id);
        if (!vente || vente.codeInsee !== code) return;
        setToutes(v);
        setTout(true);
        setOuverte(id);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => document.getElementById(`v-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })),
        );
      });
    };
    window.addEventListener(EVT_OUVRIR, ouvrir);
    return () => window.removeEventListener(EVT_OUVRIR, ouvrir);
  }, [code]);

  const montrees = ventes ? (tout ? ventes : ventes.slice(0, D_ABORD)) : [];
  return (
    <div ref={ref} className="vdvf-liste" data-nosnippet="">
      {erreur && <p className="vdvf-liste__etat">Le détail des ventes n’a pas pu être chargé. Rechargez la page pour réessayer.</p>}
      {!ventes && !erreur && <p className="vdvf-liste__etat">Chargement des ventes du {nom}…</p>}
      {ventes && (
        <>
          {ventes.length > 1 && (
            <div className="vdvf-tri" role="group" aria-label={`Trier les ventes du ${nom}`}>
              <span className="vdvf-tri__lib">Trier par</span>
              {TRIS.map((t) => (
                <button key={t.cle} type="button" className="vdvf-tri__btn" aria-pressed={tri === t.cle} onClick={() => setTri(t.cle)}>
                  {t.libelle}
                </button>
              ))}
            </div>
          )}
          <div className="vdvf-entete" aria-hidden="true">
            <span className="vdvf-c vdvf-c--date">Date</span>
            <span className="vdvf-c vdvf-c--rue">Rue</span>
            <span className="vdvf-c vdvf-c--type">Type</span>
            <span className="vdvf-c vdvf-c--lots">Lots</span>
            <span className="vdvf-c vdvf-c--surf">Surface</span>
            <span className="vdvf-c vdvf-c--prix">Prix</span>
            <span className="vdvf-c vdvf-c--m2">Prix au m²</span>
            <span className="vdvf-c vdvf-c--rdt">Rendement</span>
            <span className="vdvf-ligne__fleche" />
          </div>
          <ul className="vdvf-lignes">
            {montrees.map((v) => (
              <Ligne key={v.id} v={v} ouverte={ouverte === v.id} basculer={() => setOuverte(ouverte === v.id ? null : v.id)} />
            ))}
          </ul>
          {ventes.length > D_ABORD && !tout && (
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={() => setTout(true)}>
                Voir les {ventes.length - D_ABORD} autres ventes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

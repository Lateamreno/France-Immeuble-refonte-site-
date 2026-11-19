import type { Metadata } from "next";
import { Fragment } from "react";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { FondPhoto } from "@/components/FondPhoto";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { FiltreLexique } from "@/components/FiltreLexique";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { LEXIQUE, TERMES_PAR_ID, lexiqueParLettre, type Terme } from "@/lib/lexique";
import { imagesPartage } from "@/lib/partage";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";

/**
 * /lexique/ (lot 142, MAV, 19/11/2026 : « il faut qu'on créé une page lexique »). Les mots du lexique de MAV,
 * réécrits et mis à jour, et ceux du site (`src/lib/lexique.ts`). Une ancre par mot (/lexique/#indivision),
 * données DefinedTermSet, un filtre qui ne fait que cacher, le formulaire d'estimation en fin de page.
 */
const URL_PAGE = "/lexique/";
const TITRE = "Lexique de l’immeuble de rapport";
const DESCRIPTION =
  "Rentabilité brute, préemption, état locatif, loi Aurillac, démembrement : les mots de la vente d’un immeuble de rapport, expliqués simplement.";

export const metadata: Metadata = {
  title: TITRE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${URL_PAGE}` },
  openGraph: { images: imagesPartage(URL_PAGE), type: "website", title: `${TITRE} | France Immeuble`, description: DESCRIPTION, url: URL_PAGE },
};

const texteDe = (t: Terme) => [...t.texte, t.formule ? `Formule : ${t.formule}.` : "", t.note ? `${t.note.titre} : ${t.note.texte}` : ""].filter(Boolean).join(" ");

function donneesLexique() {
  const set = `${SITE.url}${URL_PAGE}#lexique`;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": set,
    name: TITRE,
    description: DESCRIPTION,
    url: `${SITE.url}${URL_PAGE}`,
    inLanguage: "fr-FR",
    publisher: { "@id": `${SITE.url}/#organisation` },
    hasDefinedTerm: LEXIQUE.map((t) => ({
      "@type": "DefinedTerm",
      "@id": `${SITE.url}${URL_PAGE}#${t.id}`,
      name: t.terme,
      ...(t.aussi ? { alternateName: t.aussi } : {}),
      description: texteDe(t),
      url: `${SITE.url}${URL_PAGE}#${t.id}`,
      inDefinedTermSet: set,
    })),
  };
}

export default function Lexique() {
  const groupes = lexiqueParLettre();
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Lexique", url: URL_PAGE },
        ])}
      />
      <JsonLd data={donneesLexique()} />

      <HeroMedia image={VISUELS.interieurToits.src} alt={VISUELS.interieurToits.alt}>
        <>
          <Eyebrow>Lexique</Eyebrow>
          <h1>
            Le lexique de l’<span className="accent">immeuble de rapport</span>
          </h1>
          <p className="lead">
            Rentabilité nette, préemption, état locatif, démembrement : les {LEXIQUE.length} mots qu’on entend quand on
            vend ou qu’on achète un immeuble, expliqués simplement.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
          </div>
        </>
      </HeroMedia>

      <section className="section section--creme lex-sec">
        <div className="container lex">
          <div className="lex-barre">
            <nav className="lex-alpha" aria-label="Lettres du lexique">
              {groupes.map((g) => (
                <a key={g.lettre} href={`#lettre-${g.lettre.toLowerCase()}`}>{g.lettre}</a>
              ))}
            </nav>
            <FiltreLexique total={LEXIQUE.length} />
          </div>

          <div className="lex-liste">
            {groupes.map((g) => (
              <section key={g.lettre} id={`lettre-${g.lettre.toLowerCase()}`} className="lex-groupe" data-marge-ancre aria-label={`Lettre ${g.lettre}`}>
                <h2 className="lex-lettre" aria-hidden="true">{g.lettre}</h2>
                <dl>
                  {g.termes.map((t) => (
                    <div
                      key={t.id}
                      id={t.id}
                      className="lex-terme"
                      data-marge-ancre
                      data-recherche={`${t.terme} ${t.aussi ?? ""} ${t.texte.join(" ")}`}
                    >
                      <dt>
                        <dfn>{t.terme}</dfn>
                        {t.aussi && <span className="lex-aussi">Aussi : {t.aussi}</span>}
                      </dt>
                      <dd>
                        {t.formule && <p className="lex-formule">{t.formule}</p>}
                        {t.texte.map((p) => (
                          <p key={p.slice(0, 24)}>{p}</p>
                        ))}
                        {t.note && (
                          <p className="lex-note">
                            <strong>{t.note.titre}.</strong> {t.note.texte}
                          </p>
                        )}
                        {t.voir && t.voir.length > 0 && (
                          <p className="lex-voir">
                            Voir aussi :{" "}
                            {t.voir.map((id, i) => {
                              const v = TERMES_PAR_ID.get(id);
                              return v ? (
                                <Fragment key={id}>
                                  {i > 0 && ", "}
                                  <a href={`#${id}`}>{v.terme}</a>
                                </Fragment>
                              ) : null;
                            })}
                          </p>
                        )}
                        {t.lire && t.lire.length > 0 && (
                          <p className="lex-lire">
                            Lire aussi :{" "}
                            {t.lire.map((l, i) => (
                              <Fragment key={l.href}>
                                {i > 0 && " · "}
                                <a href={l.href}>{l.titre}</a>
                              </Fragment>
                            ))}
                          </p>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section id="estimer" className="section section--noir section--ecran sec-formulaire">
        <FondPhoto image="/media/atouts/signature-dossier.webp" position="40% center" clair />
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Votre immeuble</Eyebrow>
            <h2>
              Combien vaut <span className="accent">votre immeuble&nbsp;?</span>
            </h2>
            <p className="lead">
              Loyers, baux, travaux, acheteurs du secteur : nous faisons le calcul pour vous. L’estimation est gratuite
              et confidentielle.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">Préférer le téléphone · {SITE.tel}</Button>
            </div>
          </Reveal>
          <EstimationForm formulaire="vendre" libelleEnvoi="Estimer mon immeuble" />
        </div>
      </section>

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}

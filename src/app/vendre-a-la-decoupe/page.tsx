import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { LigneDefilante } from "@/components/LigneDefilante";
import { Faq, type QuestionFaq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { filAriane, service } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { HeroMedia } from "@/components/HeroMedia";
import { VISUELS } from "@/lib/visuels";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { EstimationForm } from "@/components/EstimationForm";
import { DeuxAcheteurs } from "@/components/DeuxAcheteurs";
import { CarteIdf } from "@/components/CarteIdf";
import { Picto, type NomPicto } from "@/components/Picto";

/**
 * /vendre-a-la-decoupe/ — le meilleur aimant à gros immeubles du site.
 *
 * Un immeuble qui se découpe est par définition un immeuble de taille, en zone
 * tendue, à plusieurs millions : la requête filtre d'elle-même. Le vocabulaire
 * juridique (EDD, préemption, congé pour vente, L.145-46-1) est un second
 * filtre — illisible pour un particulier, évident pour un patrimoine.
 *
 * L'argument central n'est pas « la découpe rapporte plus » : c'est que le
 * propriétaire qui vend en bloc vend à quelqu'un qui fera ce travail à sa
 * place et fera sa marge. On lui propose de le faire pour lui.
 */
export const metadata: Metadata = {
  title: "Vendre un immeuble à la découpe",
  description:
    "Vendre en bloc, c’est vendre au prix que permet le rendement. Vendu lot par lot, le même immeuble se paie au prix du marché résidentiel. Mise en copropriété, congés, préemptions, travaux et commercialisation : nous prenons l’opération en charge.",
  alternates: { canonical: "/vendre-a-la-decoupe/" },
};

/**
 * Dossier Nanterre (92), 11 lots principaux — 545 m² Carrez.
 *
 * Chiffres réels, repris de l'étude comparative et du bilan de la proposition
 * de mission. La commune est citée, jamais la rue ni le propriétaire : publier
 * une adresse identifierait des locataires en place (CLAUDE.md §2).
 *
 * Frais d'opération retenus au prix médian des fourchettes, hors travaux et
 * hors indemnités d'éviction.
 */
const CAS = {
  ville: "Nanterre (92)",
  lots: 11,
  surface: "545 m²",
  bloc: {
    prix: "1,9 M€",
    prixM2: "3 486 €/m²",
    rendement: "7,71 %",
    acheteur: "Investisseur professionnel",
    honoraires: "− 95 000 €",
    montage: "—",
    frais: "—",
    net: "1 805 000 €",
  },
  decoupe: {
    prix: "2,84 M€",
    prixM2: "5 202 €/m²",
    rendement: "5,17 %",
    acheteur: "Occupants et particuliers",
    // 163 250 € d'honoraires : 141 750 € de vente (5 % de 2 835 000 €) et
    // 21 500 € de montage (10 lots occupés à 2 000 €, 1 lot vide à 1 500 €).
    honoraires: "− 141 750 €",
    montage: "− 21 500 €",
    frais: "− 22 275 €",
    net: "2 649 475 €",
  },
  ecartBrut: "+ 0,94 M€",
  ecartPct: "+ 49 %",
  gainNet: "+ 844 475 €",
} as const;

const QUESTIONS: QuestionFaq[] = [
  {
    question: "Si je lance la découpe, je perds la possibilité de vendre en bloc ?",
    reponse: (
      <>
        <p>
          Non, et c’est le point le plus rassurant de cette opération. Tant que le premier lot
          n’est pas vendu, l’immeuble reste cessible en bloc dans son intégralité. La mise en
          copropriété ne détruit rien : elle ajoute une option.
        </p>
        <p>
          Concrètement, vous engagez quelques dizaines de milliers d’euros de frais d’étude et de
          division, et vous gardez les deux portes ouvertes jusqu’au dernier moment. Si une offre
          en bloc arrive à un prix qui vous convient, vous la prenez.
        </p>
      </>
    ),
  },
  {
    question: "Comment savoir si mon immeuble s’y prête ?",
    reponse: (
      <>
        <p>
          Ce n’est pas une question de nombre de lots, c’est une question d’écart. On capitalise
          vos loyers au taux de rendement pratiqué dans la commune : ça donne le prix qu’un
          investisseur acceptera de payer en bloc. On le compare ensuite au prix au m² auquel se
          vendent réellement les appartements du secteur.
        </p>
        <p>
          Quand le second dépasse largement le premier, la découpe crée de la valeur. Quand les
          deux se rejoignent (rendement élevé, prix résidentiel bas), elle n’en crée aucune, et
          nous vous disons de vendre en bloc.
        </p>
      </>
    ),
  },
  {
    question: "Faut-il vider l’immeuble avant de vendre ?",
    reponse: (
      <>
        <p>
          C’est la vacance qui rend la découpe intéressante. Un lot libre se vend au prix du
          marché résidentiel. Un lot occupé se vend au rendement, à un investisseur : il garde les
          mêmes limites que la vente en bloc, avec une décote à peine moins forte. Il faut donc
          donner les congés pour espérer vendre au meilleur prix.
        </p>
        <p>
          Comme vous restez propriétaire, vous n’êtes pas tenu par les mêmes obligations que les
          marchands de biens, notamment celles de la loi Aurillac : vous gardez beaucoup plus de
          souplesse. Il faut en revanche respecter les échéances des baux. Un congé manqué sur un
          bail nu, et le bail repart pour trois ans.
        </p>
      </>
    ),
  },
  {
    question: "Que se passe-t-il si un locataire veut acheter son logement ?",
    reponse: (
      <>
        <p>
          C’est prévu, et c’est même souvent une bonne sortie : pas de vacance, pas de travaux, pas
          de commercialisation. La loi lui donne un droit de préemption sur son logement, avec un
          délai de réponse encadré.
        </p>
        <p>
          Le prix qui lui est présenté est un prix net vendeur. S’il achète, nos honoraires sont
          minorés de 20 % : il n’y a pas eu de commercialisation, seulement une mission de
          négociation.
        </p>
      </>
    ),
  },
  {
    question: "Et mes locaux commerciaux ?",
    reponse: (
      <p>
        Ils suivent leur propre régime. La première vente d’un local loué déclenche le droit de
        préférence du locataire commercial. Selon les baux, il y a parfois plus à gagner à
        renégocier le loyer avant de vendre qu’à vendre en l’état : un bail sous-évalué plombe la
        valeur du lot.
      </p>
    ),
  },
  {
    question: "Combien de temps avant la première vente ?",
    reponse: (
      <p>
        Comptez environ deux mois pour arriver au règlement de copropriété et lancer les premières
        ventes, celles des lots vides ou dont le départ est déjà négocié. Les locaux commerciaux,
        vendus loués à notre réseau d’investisseurs et sur <PleinBail />, partent généralement en
        premier. Les logements occupés sortent ensuite, au fil des congés et des préemptions, sur douze à vingt-quatre mois. Le calendrier
        n’est pas tenu par nous mais par la loi : information préalable, délais de préemption,
        échéances de baux.
      </p>
    ),
  },
  {
    question: "Quels frais faut-il avancer ?",
    reponse: (
      <p>
        Nous prenons 5 000 € TTC d’avance à la signature de la mission de structuration. Comptez
        ensuite de l’ordre de 20 000 à 25 000 € de frais d’intervenants pour un immeuble d’une
        dizaine de lots : géomètre, notaire, diagnostic technique global, diagnostics par lot,
        commissaire de justice, syndic provisoire. Ces frais sont réglés directement aux
        intervenants. Nous comparons toujours plusieurs devis pour trouver le meilleur rapport
        qualité-prix, et vous gardez le choix des prestataires. Nous ne prenons aucune commission
        dessus.
      </p>
    ),
  },
  {
    question: "Comment choisissez-vous les intervenants ?",
    reponse: (
      <p>
        Pour chaque poste (géomètre, notaire, diagnostics), nous demandons plusieurs devis et les
        comparons sur quatre critères : les avis Google, la rapidité de réponse, la proximité de
        l’immeuble et le prix. Vous recevez le comparatif, avec notre recommandation, et vous
        choisissez.
      </p>
    ),
  },
  {
    question: "Est-ce que je deviens marchand de biens aux yeux du fisc ?",
    reponse: (
      <p>
        Dans la plupart des cas, non. Si vous détenez l’immeuble pour le louer depuis de
        nombreuses années, vous n’êtes pas concerné, et encore moins si vous en avez hérité. La
        question se pose surtout pour un immeuble acheté récemment pour être revendu. Si votre
        situation s’en rapproche, nous vous le signalons et votre expert-comptable tranche.
      </p>
    ),
  },
];

/** La place de marché des immeubles loués du groupe (retours #156 et #162, MAV, 04/11/2026). */
function PleinBail() {
  return <a className="lien-discret" href={SITE.pleinbail} target="_blank" rel="noopener">Plein Bail</a>;
}

/** La société de travaux du groupe (retour #135, MAV, 04/11/2026 : www.lateamreno.fr). */
function TeamReno() {
  return <a className="lien-discret" href="https://www.lateamreno.fr/" target="_blank" rel="noopener">la Team Reno</a>;
}

export default function Decoupe() {
  return (
    <>
      <JsonLd
        data={[
          filAriane([
            { nom: "Accueil", url: "/" },
            { nom: "Vendre à la découpe", url: "/vendre-a-la-decoupe/" },
          ]),
          service(
            "Vente à la découpe d’immeuble",
            "Étude comparative bloc / découpe, mise en copropriété, gestion des congés et préemptions, coordination des travaux et commercialisation lot par lot d’un immeuble de rapport.",
            "/vendre-a-la-decoupe/",
          ),
        ]}
      />

      <HeroMedia
        image={VISUELS.fenetresHeureBleue.src}
        alt={VISUELS.fenetresHeureBleue.alt}
      >
        <>
          <Eyebrow>Vente à la découpe</Eyebrow>
          <h1>
            La marge du marchand de biens,{" "}
            <span className="accent">sans lui vendre votre immeuble</span>
          </h1>
          <p className="lead">
            Celui qui rachète votre immeuble en bloc pour le découper fait un métier. Il le met en
            copropriété, négocie les départs, rénove, revend lot par lot, et fait sa marge. Nous
            faisons ce travail pour vous, et la marge vous revient.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>
              Chiffrer les deux scénarios
            </Button>
            <a className="btn btn--outline" href={SITE.telHref}>
              En parler &middot; {SITE.tel}
            </a>
          </div>
        </>
      </HeroMedia>

      {/* ───────── Le mécanisme : pourquoi l'écart existe ───────── */}
      <section className="section section--noir-2 deux-acheteurs-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>L’écart de valeur</Eyebrow>
            <h2>Deux acheteurs qui n’achètent pas la même chose</h2>
            <p className="lead">
              Le même immeuble, au même endroit, ne se vend pas au même prix selon qui l’achète.
            </p>
          </Reveal>
          <Reveal>
            <DeuxAcheteurs />
          </Reveal>
        </div>
      </section>

      {/* ───────── Le cas chiffré ───────── */}
      <section className="section section--noir-3 cas-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Un dossier réel</Eyebrow>
            <h2>
              {CAS.ville} · {CAS.lots} lots · {CAS.surface}
            </h2>
            <p className="lead">
              Un immeuble de rapport que nous avons étudié dans les deux hypothèses. Les prix à la
              découpe sont estimés selon les dernières ventes du secteur, puis ajustés avec
              plusieurs agences locales avant la commercialisation.
            </p>
          </Reveal>

          <Reveal className="compare">
            <div className="compare__col">
              <span className="compare__eyebrow">Vente en bloc</span>
              <span className="compare__prix">{CAS.bloc.prix}</span>
              <ul className="compare__lignes">
                <li>
                  <span className="k">Prix au m²</span>
                  <span className="v">{CAS.bloc.prixM2}</span>
                </li>
                <li>
                  <span className="k">Rendement offert</span>
                  <span className="v">{CAS.bloc.rendement}</span>
                </li>
                <li>
                  <span className="k">Profil d’acheteur</span>
                  <span className="v">{CAS.bloc.acheteur}</span>
                </li>
              </ul>
            </div>

            <div className="compare__col compare__col--retenu">
              <span className="compare__eyebrow">Vente à la découpe</span>
              <span className="compare__prix">{CAS.decoupe.prix}</span>
              <ul className="compare__lignes">
                <li>
                  <span className="k">Prix au m²</span>
                  <span className="v">{CAS.decoupe.prixM2}</span>
                </li>
                <li>
                  <span className="k">Rendement implicite</span>
                  <span className="v">{CAS.decoupe.rendement}</span>
                </li>
                <li>
                  <span className="k">Profil d’acheteur</span>
                  <span className="v">{CAS.decoupe.acheteur}</span>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal className="ecart">
            <span className="ecart__val">
              {CAS.ecartBrut} &middot; {CAS.ecartPct}
            </span>
            <span className="ecart__lbl">
              À {CAS.decoupe.prixM2}, le rendement tombe à {CAS.decoupe.rendement} :
              rédhibitoire pour un acheteur en bloc, donc un prix qu’aucune vente en bloc n’aurait
              permis d’atteindre.
            </span>
          </Reveal>
        </div>
      </section>

      {/* ───────── Le bilan, frais déduits ───────── */}
      <section className="section section--noir dossier-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Ce qui reste dans votre poche</Eyebrow>
            <h2>Le même dossier, tous frais déduits</h2>
            <p className="lead">
              Un écart de prix ne veut rien dire tant qu’on n’a pas payé l’opération. Voici le
              bilan complet : nos honoraires de vente, les honoraires de montage de l’opération et
              l’intégralité des frais de division.
            </p>
          </Reveal>

          <Reveal className="tableau-wrap">
            <table className="tableau">
              <caption className="sr-only">
                Comparaison du net vendeur entre une vente en bloc et une vente à la découpe
              </caption>
              <thead>
                <tr>
                  <th scope="col"><span className="tableau__long">Poste</span><span className="tableau__court"></span></th>
                  <th scope="col"><span className="tableau__long">Vente en bloc</span><span className="tableau__court">En bloc</span></th>
                  <th scope="col"><span className="tableau__long">Vente à la découpe</span><span className="tableau__court">Découpe</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="tableau__long">Prix de vente</span><span className="tableau__court">Prix</span></td>
                  <td>{CAS.bloc.prix}</td>
                  <td>{CAS.decoupe.prix}</td>
                </tr>
                <tr>
                  <td><span className="tableau__long">Honoraires de vente (5 %)</span><span className="tableau__court">Vente 5 %</span></td>
                  <td>{CAS.bloc.honoraires}</td>
                  <td>{CAS.decoupe.honoraires}</td>
                </tr>
                <tr>
                  <td>
                    <span className="tableau__long">Honoraires de montage</span><span className="tableau__court">Montage</span>
                    <span className="tableau__detail">10 lots occupés à 2 000 €, 1 lot vide à 1 500 €</span>
                  </td>
                  <td>{CAS.bloc.montage}</td>
                  <td>{CAS.decoupe.montage}</td>
                </tr>
                <tr>
                  <td><span className="tableau__long">Frais d’opération (médian, hors travaux)</span><span className="tableau__court">Frais</span></td>
                  <td>{CAS.bloc.frais}</td>
                  <td>{CAS.decoupe.frais}</td>
                </tr>
                <tr className="tableau__total">
                  <td>Net vendeur</td>
                  <td>{CAS.bloc.net}</td>
                  <td>{CAS.decoupe.net}</td>
                </tr>
              </tbody>
            </table>
          </Reveal>

          <Reveal className="ecart">
            <span className="ecart__val">{CAS.gainNet}</span>
            <span className="ecart__lbl">
              De plus dans la poche du vendeur, une fois nos honoraires et tous les frais de
              division payés.
            </span>
          </Reveal>

          <Reveal>
            <p className="tableau__note">
              Frais d’opération retenus au prix médian des fourchettes observées en Île-de-France,
              hors travaux et hors indemnités d’éviction. Chiffres d’un dossier réel : ils ne
              préjugent pas du vôtre, que nous chiffrons de la même façon avant tout engagement.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────── Le critère d'éligibilité ───────── */}
      <section className="section section--noir-2">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Le critère</Eyebrow>
            <h2>La découpe ne vaut pas le coup partout</h2>
          </Reveal>
          <Reveal>
            <p className="lead">
              Ce n’est pas une affaire de nombre de lots. On capitalise vos loyers au taux de
              rendement pratiqué dans votre commune : ça donne le prix qu’un investisseur acceptera
              de payer en bloc. On le compare au prix au m² auquel se vendent réellement les
              appartements du secteur.
            </p>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              Dans le dossier ci-dessus, l’écart est de {CAS.bloc.prixM2} contre{" "}
              {CAS.decoupe.prixM2} : il paie très largement l’opération. Ailleurs (rendement élevé,
              prix résidentiel bas), les deux valeurs se rejoignent et la découpe ne crée rien.
              Dans ce cas nous vous le disons, et nous vendons en bloc.
            </p>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              <strong>Rien n’est irréversible.</strong> Tant que le premier lot n’est pas vendu,
              l’immeuble reste cessible en bloc. La mise en copropriété n’enlève aucune option :
              elle en ajoute une.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────── Ce que nous prenons en charge ───────── */}
      {/* Les six étapes défilent sur une frise : la section tient sur un écran
          (MAV, 27/10/2026). */}
      <section className="section section--noir-3 mission-sec">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Notre mission</Eyebrow>
            <h2>Vous n’avez pas à devenir marchand de biens</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              C’est un métier : cinq corps d’intervenants, un calendrier légal contraint, des
              négociations locataire par locataire. Nous nous en occupons pour vous, afin de vous
              garantir la marge du marchand.
            </p>
            <div className="btn-row mission-sec__bouton">
              <Button href="#estimer" icone>
                Faire étudier mon immeuble
              </Button>
            </div>
          </Reveal>

          <LigneDefilante className="etapes-ligne">
            {[
              {
                n: "01",
                t: "La grille de prix, lot par lot",
                p: "Valorisation de chaque lot en valeur libre et en valeur occupée, puis séquencement des sorties : quel lot part en premier, lequel attend un départ, lequel se vend occupé.",
                m: "Deux estimations croisées",
                picto: "calculatrice",
              },
              {
                n: "02",
                t: "La mise en copropriété",
                p: "Géomètre-expert pour l’état descriptif de division et les tantièmes, diagnostic technique global, notaire pour le règlement, syndic provisoire. Nous mettons chaque intervenant en concurrence et pilotons l’enchaînement.",
                m: "Cinq intervenants coordonnés",
                picto: "dossier",
              },
              {
                n: "03",
                t: "Les départs et les préemptions",
                p: "Négociation amiable des départs, rachats de bail, congés pour vente aux échéances éligibles, offres de vente valant préemption. C’est le volet le plus délicat de l’opération et celui qui commande le calendrier.",
                m: "Calendrier légal tenu",
                picto: "agenda",
              },
              {
                n: "04",
                t: "Les baux commerciaux",
                p: "Droit de préférence du locataire commercial à la première vente, et renégociation du bail quand le loyer est manifestement sous-évalué : un bail en dessous du marché plombe la valeur du lot.",
                m: "Valeur du lot défendue",
                picto: "commerce",
              },
              {
                n: "05",
                t: "Les travaux des lots libres",
                p: <>Devis comparés, vérification des assurances et attestations, suivi de chantier, conformité et réception. Sans honoraires lorsque les travaux passent par <TeamReno />, à des conditions tarifaires avantageuses ; 3 % du montant des travaux avec une entreprise extérieure.</>,
                m: "Rénovation avant vente",
                picto: "technique",
              },
              {
                n: "06",
                t: "La commercialisation",
                p: <>Les lots occupés sont proposés aux investisseurs sur <PleinBail />. Les lots libres sont confiés à une sélection d’agences locales, qui les vendent aux occupants sans surcoût pour vous.</>,
                m: "Deux marchés, deux prix",
                picto: "reseau",
              },
            ].map((e) => (
              <article key={e.n} className="etape-frise etape-frise--picto">
                <Picto nom={e.picto as NomPicto} taille={40} className="etape-frise__picto" />
                <span className="step__num">Étape {e.n} · {e.m}</span>
                <h3>{e.t}</h3>
                <p>{e.p}</p>
              </article>
            ))}
          </LigneDefilante>
        </div>
      </section>

      {/* ───────── Le cadre légal ───────── */}
      <section className="section section--noir cadre-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Le cadre à respecter</Eyebrow>
            <h2>Ce que la loi impose avant la première vente</h2>
            <p className="lead">
              Rien d’insurmontable, mais rien d’optionnel non plus. L’ordre compte : un diagnostic
              manquant bloque le règlement de copropriété, un règlement non publié bloque toute
              vente.
            </p>
          </Reveal>
          <Reveal>
            <ul className="cadre">
              <li>
                <Picto nom="technique" taille={24} className="cadre__picto" />
                <strong>Diagnostic technique global</strong> : obligatoire avant toute mise en
                copropriété d’un immeuble de plus de dix ans, et préalable au règlement.
              </li>
              <li>
                <Picto nom="stats" taille={24} className="cadre__picto" />
                <strong>DPE collectif de l’immeuble</strong> : exigé pour toute copropriété. Il
                s’obtient dans la même mission que le diagnostic technique global.
              </li>
              <li>
                {/* Retour #183 : la division en lots, pas la surélévation. */}
                <Picto nom="logement" taille={24} className="cadre__picto" />
                <strong>État descriptif de division et tantièmes</strong> : établis par un
                géomètre-expert. Sur un immeuble mixte, les grilles de charges habitation et
                commerces se traitent séparément : une erreur se paie pendant toute la vie de la
                copropriété.
              </li>
              <li>
                <Picto nom="dossier" taille={24} className="cadre__picto" />
                <strong>Règlement de copropriété</strong> : rédigé et publié par le notaire, qui
                immatricule le syndicat au registre national dans la foulée.
              </li>
              <li>
                <Picto nom="bulles" taille={24} className="cadre__picto" />
                <strong>Information préalable des locataires</strong> : puis offres de vente valant
                droit de préemption, avec des délais de réponse encadrés.
              </li>
              <li>
                <Picto nom="agenda" taille={24} className="cadre__picto" />
                <strong>Congé pour vente</strong> : délivrable six mois avant le terme du bail
                seulement. C’est ce qui fixe les fenêtres de tir, pas notre calendrier commercial.
              </li>
              <li>
                <Picto nom="commerce" taille={24} className="cadre__picto" />
                <strong>Droit de préférence du locataire commercial</strong> : déclenché par la
                première vente d’un local loué.
              </li>
              <li>
                <Picto nom="loupe" taille={24} className="cadre__picto" />
                <strong>Diagnostics par lot</strong> : un DPE d’immeuble ne suffit pas à vendre :
                chaque lot a les siens.
              </li>
              <li>
                <Picto nom="valide" taille={24} className="cadre__picto" />
                <strong>Autorisation préalable de division</strong> : selon la commune. La division
                est par ailleurs interdite sur un immeuble frappé d’arrêté de péril ou
                d’insalubrité.
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ───────── Honoraires ───────── */}
      <section className="section section--noir-2 couts-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Nos honoraires</Eyebrow>
            {/* Retours #185 et #186 (MAV, 04/11/2026). */}
            <h2>Des honoraires <span className="accent">connus d’avance</span></h2>
            <p className="lead">
              Notre travail s’organise autour de deux missions : la structuration de la
              copropriété, puis la commercialisation des lots. Nos honoraires rémunèrent ces deux
              missions. Pour le reste, géomètre, notaire, diagnostics et syndic, nous mettons les
              intervenants en concurrence pour que cela vous coûte le moins possible. Ils vous
              facturent directement, sans marge de notre part.
            </p>
          </Reveal>

          <Reveal>
            <ul className="tarifs">
              <li>
                <Picto nom="profil" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Forfait de structuration, par lot occupé</span>
                <span className="tarifs__val">2 000 € TTC</span>
                <span className="tarifs__note">
                  5 000 € TTC à la signature du contrat de structuration, le solde des forfaits à la
                  première vente d’un lot.
                </span>
              </li>
              <li>
                <Picto nom="logement" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Forfait de structuration, par lot vide</span>
                <span className="tarifs__val">1 500 € TTC</span>
              </li>
              <li>
                <Picto nom="euro" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Commission de vente, par lot</span>
                <span className="tarifs__val">5 % TTC</span>
                <span className="tarifs__note">
                  À la charge du vendeur, exigible à chaque acte authentique.
                </span>
              </li>
              <li>
                <Picto nom="poignee" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Vente à un locataire qui préempte</span>
                <span className="tarifs__val">− 20 % sur la commission</span>
                <span className="tarifs__note">
                  Le prix présenté au locataire est un prix net vendeur. Il n’y a pas eu de
                  commercialisation, seulement une mission de négociation.
                </span>
              </li>
              <li>
                <Picto nom="technique" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Coordination des travaux</span>
                <span className="tarifs__val">0 % ou 3 % TTC</span>
                <span className="tarifs__note">
                  Sans honoraires lorsque les travaux passent par <TeamReno />, à des conditions
                  tarifaires avantageuses. 3 % du montant coordonné avec une entreprise
                  extérieure.
                </span>
              </li>
              <li>
                <Picto nom="equipe" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">
                  Frais d’intervenants : géomètre, notaire, diagnostics, syndic
                </span>
                <span className="tarifs__val">≈ 20 à 25 000 €</span>
                <span className="tarifs__note">
                  Ordre de grandeur pour une dizaine de lots. Réglés directement aux intervenants,
                  que nous mettons en concurrence. Hors travaux et hors indemnités d’éviction.
                </span>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ───────── Périmètre ───────── */}
      {/* Retour #159 (MAV, 04/11/2026) : Paris et l'Île-de-France, avec la carte. */}
      <section className="section section--noir-3 perimetre-sec">
        <div className="container split">
          <Reveal className="section__head">
            <Eyebrow>Où nous intervenons</Eyebrow>
            <h2>Paris et Île-de-France</h2>
            <p className="lead">
              Une découpe se pilote sur le terrain : rendez-vous locataire par locataire,
              entreprises à suivre, syndic à installer, mairie à interroger. Nous la proposons à
              Paris et en Île-de-France, là où nous pouvons être présents dans la journée. Ailleurs,
              nous ne pouvons pas encore la proposer, sauf au cas par cas quand nous avons déjà des
              partenaires sur place.
            </p>
          </Reveal>
          <Reveal delayIndex={1} className="perimetre-carte">
            <CarteIdf />
          </Reveal>
        </div>
      </section>

      <section className="section section--noir faq-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Questions fréquentes</Eyebrow>
            <h2>Ce que les propriétaires nous demandent</h2>
          </Reveal>
          <Reveal>
            <Faq items={QUESTIONS} />
          </Reveal>
        </div>
      </section>

      {/* Tous les boutons de la page mènent ici (retours #132 et #133, MAV, 03/11/2026). */}
      <section id="estimer" className="section section--noir-2 section--ecran sec-formulaire">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Étude sans engagement</Eyebrow>
            <h2>Bloc ou découpe&nbsp;: on vous donne les deux chiffres</h2>
            <p className="lead">
              Décrivez-nous l’immeuble et ses loyers. Nous vous accompagnons ensuite dans le choix
              de la solution adaptée.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">Préférer le téléphone · {SITE.tel}</Button>
            </div>
          </Reveal>
          <EstimationForm formulaire="vendre" />
        </div>
      </section>
      <BoutonFixeMobile href="#estimer" libelle="Faire étudier mon immeuble" cible="estimer" />
    </>
  );
}

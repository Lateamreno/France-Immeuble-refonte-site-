/** Injecte un bloc de données structurées. Rendu côté serveur, jamais hydraté. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // `<` échappé : un texte déposé ne peut pas fermer la balise script.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

// Prévient Bing (et les moteurs du protocole IndexNow) des pages du site, après une mise en production.
// Lot 124 : ChatGPT cherche surtout avec Bing. La clé est publique par conception (fichier à la racine).
// Usage : node scripts/indexnow.mjs            toutes les adresses du sitemap
//         node scripts/indexnow.mjs /a/ /b/    seulement ces pages
const SITE = "https://www.france-immeuble.fr";
const CLE = "4786be7e6c8d4f720cf80414e4de03fb";

const chemins = process.argv.slice(2);
let urls;
if (chemins.length) {
  urls = chemins.map((c) => SITE + c);
} else {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: "www.france-immeuble.fr", key: CLE, keyLocation: `${SITE}/${CLE}.txt`, urlList: urls }),
});
console.log(`IndexNow : ${urls.length} adresses, réponse ${r.status}`);

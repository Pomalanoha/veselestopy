/**
 * Migrace článků z Frameru (veselestopy.cz) do Astro Markdownu.
 *
 * Co dělá:
 *  - projde seznam článků (níže, vytažený ze sitemap.xml),
 *  - stáhne každou stránku, vytáhne nadpis, datum, kategorii, cover a popis,
 *  - hlavní obsah převede na Markdown (včetně tabulek, citací, obrázků),
 *  - obrázky stáhne lokálně do public/images/clanky a přepíše odkazy,
 *  - zapíše .md soubor do src/content/clanky/.
 *
 * Spuštění (z kořene projektu):
 *   npm install            # jednorázově – doinstaluje balíčky níže
 *   npm run migrate
 *
 * Potřebné balíčky (jsou v package.json jako devDependencies):
 *   jsdom, @mozilla/readability, turndown, turndown-plugin-gfm
 */

import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const BASE = "https://veselestopy.cz";
const OUT_DIR = "src/content/clanky";
const IMG_DIR = "public/images/clanky";
const IMG_WEB = "/images/clanky";
const KNOWN_CATEGORIES = new Set([
  "zavody",
  "tydenni-report",
  "zlomit-3-hodiny",
  "recenze",
]);

// Kategorie nejsou na stránce článku spolehlivě dostupné (jen sidebar),
// proto je bereme z exportu Framer CMS. Slug -> pole kategorií (první = primární).
const C = { Z: "zlomit-3-hodiny", T: "tydenni-report", R: "zavody", X: "recenze" };
const CATEGORY_MAP = {
  "pul-roku-klidu-a-ted-zpatky-do-treninku": [C.Z],
  "budapestsky-maraton-pribeh-osobaku-a-datove-preciznosti": [C.R],
  "cil-v-dohledu-a-pribeh-maratonu": [C.R, C.T, C.Z],
  "jasne-ladeni-formy-kopce-a-neove-ruzova-taktika": [C.T, C.Z],
  "posledni-velky-zatah-intervalove-vlny-gely-a-maratonova-forma": [C.T, C.Z],
  "zavod-za-nami-fokus-na-maraton": [C.T, C.Z],
  "tyden-kdy-se-ladila-forma-na-vylet-na-jih": [C.T, C.R, C.Z],
  "fartlek-intervaly-a-ladeni-formy-pred-zavodem": [C.T, C.Z],
  "flow-prase-v-lese-a-spatny-gel": [C.T, C.Z],
  "novy-treninkovy-kalendar-vsechny-me-behy-ted-skoro-na-jednom-miste": [C.Z],
  "domaci-hriste-a-horske-vyzvy-v-krkonosich": [C.T, C.Z],
  "rychlost-u-reky-horske-kopce-a-navrat-domu": [C.T, C.Z],
  "beh-v-tropech-hledani-kopcu-a-presun-do-hor": [C.T, C.Z],
  "regenerace-kvalita-a-kena-v-srdci-treninku": [C.T, C.Z],
  "intervaly-dest-unava-kontrola": [C.T, C.Z],
  "rychlost-stupnovani-a-kopce-s-bonusem": [C.T, C.Z],
  "plyometrie-dech-a-tempo-v-rytmu-pokroku": [C.T, C.Z],
  "nove-zony-nezdareny-test-a-trailove-dobrodruzstvi": [C.T, C.Z],
  "budovani-anp-posouvani-hranice": [C.T, C.Z],
  "pitevna-treninku-intervaly-4x2km-8x300m": [C.Z],
  "regenerace-kopce-a-navrat-k-tempu": [C.T, C.Z],
  "ladeni-formy-a-zavod-v-budejovicich": [C.R, C.T, C.Z],
  "kdyz-trenujes-v-terenu-kde-rovina-neexistuje": [C.T, C.Z],
  "navrat-do-tempa-dve-kvality-a-dlouhy-beh-s-usmevem": [C.T, C.Z],
  "tyden-18-a-19-fartleky-kopce-a-relax-pod-plachtami": [C.T, C.Z],
  "tyden-sprintu-temp-a-noveho-uvedomeni-trenink-je-v-pohode-hlava-musi-dohnat": [C.T, C.Z],
  "pardubicka-desitka-a-jak-mi-zhasla-svetla-uprostred-zavodu": [C.T, C.Z, C.R],
  "navrat-k-plnemu-treninku-a-ladeni-formy-na-pardubickou-desitku": [C.T, C.Z],
  "pitevna-treninku-jak-jsem-temer-dokonale-zvladl-intervaly-2-04-12-04-12-04-2km": [C.Z],
  "fartlek-strevni-viroza-a-znovuzrozeni-v-novych-botach": [C.T, C.Z],
  "rodina-prvni-misto-bez-100-procent": [C.T, C.Z],
  "tyden-ve-znameni-zatezoveho-testu-a-prvniho-jarniho-twirun": [C.T, C.Z],
  "zatezovy-test-a-laktatova-krivka-pro-behani": [C.Z],
  "dalsi-tyden-v-plnem-tempu": [C.T, C.Z],
  "jarni-slunce-rychle-tempo-a-nova-letni-vybava-od-mizuno": [C.T, C.Z],
  "mrazy-led-a-uspech-na-winter-run": [C.Z],
  "rodinna-dovolena-sprinty-a-beh-na-snehu": [C.Z],
  "100-odbehano-rodinne-radosti-a-zaslouzeny-odpocinek": [C.Z],
  "tempo-beh-na-pasu-a-nove-bezecke-hracky": [C.Z],
  "tyden-4-52": [C.Z],
  "tyden-3-52": [C.Z],
  "mizuno-team-cz-nova-posila-na-ceste-k-budapestskemu-maratonu": [C.Z],
  "ranni-mrazy-odpocinek-a-vyhlizeni-jarniho-boostu": [C.Z],
};

// Seznam článků (ze sitemap.xml)
const ARTICLES = [
  "/clanky/pul-roku-klidu-a-ted-zpatky-do-treninku",
  "/clanky/budapestsky-maraton-pribeh-osobaku-a-datove-preciznosti",
  "/clanky/cil-v-dohledu-a-pribeh-maratonu",
  "/clanky/jasne-ladeni-formy-kopce-a-neove-ruzova-taktika",
  "/clanky/posledni-velky-zatah-intervalove-vlny-gely-a-maratonova-forma",
  "/clanky/zavod-za-nami-fokus-na-maraton",
  "/clanky/tyden-kdy-se-ladila-forma-na-vylet-na-jih",
  "/clanky/fartlek-intervaly-a-ladeni-formy-pred-zavodem",
  "/clanky/flow-prase-v-lese-a-spatny-gel",
  "/clanky/novy-treninkovy-kalendar-vsechny-me-behy-ted-skoro-na-jednom-miste",
  "/clanky/domaci-hriste-a-horske-vyzvy-v-krkonosich",
  "/clanky/rychlost-u-reky-horske-kopce-a-navrat-domu",
  "/clanky/beh-v-tropech-hledani-kopcu-a-presun-do-hor",
  "/clanky/regenerace-kvalita-a-kena-v-srdci-treninku",
  "/clanky/intervaly-dest-unava-kontrola",
  "/clanky/rychlost-stupnovani-a-kopce-s-bonusem",
  "/clanky/plyometrie-dech-a-tempo-v-rytmu-pokroku",
  "/clanky/nove-zony-nezdareny-test-a-trailove-dobrodruzstvi",
  "/clanky/budovani-anp-posouvani-hranice",
  "/clanky/pitevna-treninku-intervaly-4x2km-8x300m",
  "/clanky/regenerace-kopce-a-navrat-k-tempu",
  "/clanky/ladeni-formy-a-zavod-v-budejovicich",
  "/clanky/kdyz-trenujes-v-terenu-kde-rovina-neexistuje",
  "/clanky/navrat-do-tempa-dve-kvality-a-dlouhy-beh-s-usmevem",
  "/clanky/tyden-18-a-19-fartleky-kopce-a-relax-pod-plachtami",
  "/clanky/tyden-sprintu-temp-a-noveho-uvedomeni-trenink-je-v-pohode-hlava-musi-dohnat",
  "/clanky/pardubicka-desitka-a-jak-mi-zhasla-svetla-uprostred-zavodu",
  "/clanky/navrat-k-plnemu-treninku-a-ladeni-formy-na-pardubickou-desitku",
  "/clanky/pitevna-treninku-jak-jsem-temer-dokonale-zvladl-intervaly-2-04-12-04-12-04-2km",
  "/clanky/fartlek-strevni-viroza-a-znovuzrozeni-v-novych-botach",
  "/clanky/rodina-prvni-misto-bez-100-procent",
  "/clanky/tyden-ve-znameni-zatezoveho-testu-a-prvniho-jarniho-twirun",
  "/clanky/zatezovy-test-a-laktatova-krivka-pro-behani",
  "/clanky/dalsi-tyden-v-plnem-tempu",
  "/clanky/jarn%C3%AD-slunce-rychl%C3%A9-tempo-a-nov%C3%A1-letn%C3%AD-v%C3%BDbava-od-mizuno",
  "/clanky/mrazy-led-a-uspech-na-winter-run",
  "/clanky/rodinna-dovolena-sprinty-a-beh-na-snehu",
  "/clanky/100-odbehano-rodinne-radosti-a-zaslouzeny-odpocinek",
  "/clanky/tempo-beh-na-pasu-a-nove-bezecke-hracky",
  "/clanky/tyden-4-52",
  "/clanky/tyden-3-52",
  "/clanky/mizuno-team-cz-nova-posila-na-ceste-k-budapestskemu-maratonu",
  "/clanky/ranni-mrazy-odpocinek-a-vyhlizeni-jarniho-boostu",
];

// ---------- pomocné funkce ----------

const td = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});
td.use(gfm);
// nezachovávat prázdné odkazy/figury
td.addRule("stripEmptyLinks", {
  filter: (node) =>
    node.nodeName === "A" && !node.textContent.trim() && !node.querySelector("img"),
  replacement: () => "",
});

const imageCache = new Map();

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "veselestopy-migrace" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} pro ${url}`);
  return res.text();
}

function removeDiacritics(s) {
  // odstraní kombinující diakritická znaménka (U+0300–U+036F)
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slugFromUrl(urlPath) {
  const raw = decodeURIComponent(urlPath.split("/").pop());
  return removeDiacritics(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanTitle(t) {
  return t
    .replace(/\s*-\s*#?veselestopy\.cz\s*$/i, "")
    .replace(/\s*\|\s*veselestopy\.cz\s*$/i, "")
    .trim();
}

function parseCzechDate(text) {
  const m = text.match(/\b(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})\b/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function metaContent(doc, sel) {
  const el = doc.querySelector(sel);
  return el ? el.getAttribute("content") : null;
}

async function localImage(url) {
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url);
  try {
    const clean = url.split("?")[0];
    let name = decodeURIComponent(path.basename(clean)) || `img-${imageCache.size}`;
    name = removeDiacritics(name).replace(/[^a-zA-Z0-9._-]/g, "-");
    if (!/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)) name += ".png";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(path.join(IMG_DIR, name), buf);
    const web = `${IMG_WEB}/${name}`;
    imageCache.set(url, web);
    return web;
  } catch (e) {
    console.warn(`   ⚠️  obrázek se nepodařilo stáhnout: ${url} (${e.message})`);
    imageCache.set(url, url); // ponecháme původní URL
    return url;
  }
}

function yamlString(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

// ---------- hlavní zpracování jednoho článku ----------

async function processArticle(urlPath) {
  const url = BASE + urlPath;
  const slug = slugFromUrl(urlPath);
  console.log(`→ ${slug}`);

  const html = await fetchText(url);
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const title = cleanTitle(metaContent(doc, 'meta[property="og:title"]') || doc.title);
  const coverRemote = metaContent(doc, 'meta[property="og:image"]');
  const catHref =
    [...doc.querySelectorAll('a[href*="/kategorie/"]')]
      .map((a) => a.getAttribute("href"))
      .find(Boolean) || "";
  let category = decodeURIComponent(catHref.split("/").pop() || "").trim();
  if (!KNOWN_CATEGORIES.has(category)) {
    console.warn(`   ⚠️  neznámá kategorie "${category}", nastav ručně.`);
  }
  const date = parseCzechDate(doc.body.textContent) || "";

  // hlavní obsah přes Readability (z čisté kopie DOM)
  const readDom = new JSDOM(html, { url });
  const article = new Readability(readDom.window.document).parse();
  if (!article || !article.content) {
    console.warn(`   ⚠️  obsah se nepodařilo extrahovat – přeskočeno.`);
    return;
  }

  // stáhnout a přepsat obrázky uvnitř obsahu
  const contentDom = new JSDOM(`<div id="root">${article.content}</div>`);
  const root = contentDom.window.document.getElementById("root");
  for (const img of [...root.querySelectorAll("img")]) {
    const src = img.getAttribute("src");
    const local = await localImage(src);
    img.setAttribute("src", local);
    img.removeAttribute("srcset");
  }

  // Tabulky: Framer dává do buněk blokové elementy, kvůli kterým se Markdown
  // tabulka rozpadne. Sloučíme obsah každé buňky na jeden řádek
  // (a zachováme tučné písmo, pokud je tučná celá buňka).
  const cdoc = contentDom.window.document;
  for (const cell of [...root.querySelectorAll("th, td")]) {
    const text = cell.textContent.replace(/\s+/g, " ").trim();
    const strong = cell.querySelector("strong, b");
    const fullyBold =
      strong && strong.textContent.replace(/\s+/g, " ").trim() === text && !!text;
    cell.textContent = "";
    if (fullyBold) {
      const s = cdoc.createElement("strong");
      s.textContent = text;
      cell.appendChild(s);
    } else {
      cell.textContent = text;
    }
  }

  // popis z prvního odstavce mimo citaci/obrázek
  const descP = [...root.querySelectorAll("p")].find(
    (p) => !p.closest("blockquote") && !p.closest("figure") && p.textContent.trim(),
  );
  const description = descP
    ? descP.textContent.trim().replace(/\s+/g, " ").slice(0, 180)
    : "";

  const markdown = td.turndown(root.innerHTML).trim();
  const words = article.textContent.trim().split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.round(words / 200));
  const coverLocal = coverRemote ? await localImage(coverRemote) : null;

  const frontmatter = [
    "---",
    `title: ${yamlString(title)}`,
    description ? `description: ${yamlString(description)}` : null,
    `date: ${date}`,
    `category: ${yamlString(category)}`,
    coverLocal ? `cover: ${yamlString(coverLocal)}` : null,
    `readingMinutes: ${readingMinutes}`,
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  await fs.writeFile(
    path.join(OUT_DIR, `${slug}.md`),
    frontmatter + "\n" + markdown + "\n",
  );
  console.log(`   ✓ uloženo (${date}, ${category}, ${readingMinutes} min)`);
}

// ---------- běh ----------

function selectArticles() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const onlyArg = args.find((a) => a.startsWith("--only="));
  let list = ARTICLES;
  if (onlyArg) {
    const needle = onlyArg.split("=")[1];
    list = list.filter((a) => a.includes(needle));
  }
  if (limitArg) {
    list = list.slice(0, Number(limitArg.split("=")[1]) || list.length);
  }
  return list;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const list = selectArticles();
  console.log(`Zpracuji ${list.length} z ${ARTICLES.length} článků.\n`);

  let ok = 0;
  let fail = 0;
  for (const a of list) {
    try {
      await processArticle(a);
      ok++;
    } catch (e) {
      fail++;
      console.error(`   ✗ chyba u ${a}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 400)); // šetrná prodleva
  }
  console.log(`\nHotovo. Úspěšně: ${ok}, chyby: ${fail}.`);
  console.log("Spusť `npm run dev` a zkontroluj články na webu.");
}

main();

# Návrh migrace veselestopy.cz z Frameru na vlastní řešení

## Cíl
Zbavit se měsíčního poplatku za Framer, přejít na moderní open-source stack (Astro), zachovat čistý a moderní vzhled, mít pohodlný vizuální editor pro psaní článků a přenést všechny stávající články. **Začínáme lokálně** — nejdřív si vše rozjedeme na tvém počítači, nasazení na web řešíme až později.

## Co jsem zjistil z analýzy webu
Web je klasický běžecký blog s těmito prvky:

- **Články** na `/clanky/[slug]` — bohatý obsah: nadpisy, citace, tabulky, obrázky, seznamy, emoji
- **Kategorie:** Závody, Týdenní report, Zlomit3Hodiny, Recenze
- **Stránky:** Úvod, Kalendář, Kategorie, O mně, Kontakt, Ochrana osobních údajů
- **Integrace Strava** — widget posledních aktivit
- **Partneři** — loga (Mizuno, FyzioFit, Vamos66)
- **Sociální sítě** — X, Instagram, Facebook, Threads
- Obrázky hostované na `framerusercontent.com`

Důležité: Framer generuje **vyhledávací index** (JSON), ve kterém jsou všechny články včetně obsahu. Ověřil jsem, že z něj jde vytáhnout seznam všech článků (jsou jich desítky) — **automatická migrace je tedy proveditelná**.

---

## Doporučený stack (vše zdarma)

| Vrstva | Doporučení | Proč |
|---|---|---|
| **Framework** | **Astro** | Přesně pro blogy. Generuje statický web, posílá skoro nula JavaScriptu → rychlé, levné, hostovatelné kdekoliv zdarma. |
| **Obsah** | **Markdown/MDX + Astro Content Collections** | Články jako soubory v projektu. Plná kontrola, žádný cizí server, snadné zálohování (Git). |
| **CMS (editor)** | **TinaCMS** | Vizuální editor v prohlížeči nejblíž tomu, co máš ve Frameru — psaní s náhledem, nahrávání obrázků. Zdarma pro jednoho autora. Edituje přímo Markdown soubory. |
| **Styling** | **Tailwind CSS** | Rychlé znovupostavení čistého, moderního designu. |
| **Hosting (později)** | **Cloudflare Pages** | Zdarma, rychlé, automatické nasazení z Gitu. Až budeme připraveni. |

### Proč TinaCMS a ne jiné CMS
Tvoje volba „vizuální editor v prohlížeči" má dvě hlavní bezplatné cesty:

- **TinaCMS** — má opravdový WYSIWYG editor s živým náhledem, správu obrázků, běží i čistě lokálně (`tinacms dev`) bez nutnosti zakládat účty. Nejvíc se podobá Frameru. **Doporučuji tuto.**
- **Sveltia CMS / Decap CMS** — taky zdarma a open-source, jednodušší rozhraní, napojené na GitHub. Dobrá záloha, pokud by ti Tina nevyhovovala.

Headless CMS v cloudu (Sanity apod.) jsem vyřadil — přidává závislost na další službě a pro osobní blog je to zbytečná komplikace.

---

## Jak to uděláme — postup

### Fáze 1: Lokální základ (start tady)
1. Založím projekt **Astro** s blogovou strukturou (Content Collections pro články a kategorie).
2. Postavím **layout a design** v Tailwindu — zachovám čistý, moderní vzhled: hero s portrétem, karty článků, štítky kategorií, sekce Partneři, odkazy na sítě. (Vzhled nebude 1:1, ale ve stejném duchu.)
3. Vytvořím stránky: domovská, detail článku, výpis kategorie, O mně, Kontakt, Soukromí.
4. Zprovozním web lokálně — uvidíš ho v prohlížeči na `localhost`.

### Fáze 2: Migrace obsahu
5. Napíšu **migrační skript**, který z Framer vyhledávacího indexu vytáhne seznam všech článků, stáhne text i obrázky a převede je do Markdownu (včetně nadpisů, tabulek, citací, datumů, kategorií).
6. Obrázky uložím lokálně do projektu (ať nejsme závislí na Frameru).
7. Projdeme pár článků a doladíme převod (tabulky, emoji, formátování).

### Fáze 3: Vizuální editor
8. Napojím **TinaCMS** v lokálním režimu → budeš mít editor na `localhost/admin`, kde píšeš články s náhledem a nahráváš obrázky, vše se ukládá do souborů projektu.

### Fáze 4: Nasazení (až budeš chtít)
9. Projekt dáme do Gitu a napojíme na **Cloudflare Pages** (zdarma). Web pojede na vlastní doméně `veselestopy.cz`, Framer se zruší.
10. Volitelně doladíme Stravu (oficiální embed nebo napojení přes API), kontaktní formulář, přesměrování URL kvůli SEO (zachováme stejné adresy `/clanky/...`).

---

## Náklady
- **Software:** 0 Kč — Astro, TinaCMS, Tailwind i Cloudflare Pages jsou zdarma.
- **Doména:** ponecháš stávající `veselestopy.cz` (platíš jen za doménu, ne za Framer).
- **Úspora:** celý měsíční poplatek za Framer.

## Na co myslet
- **SEO:** zachováme stejné adresy článků (`/clanky/[slug]`), ať nepřijdeš o pozice ve vyhledávání.
- **Strava widget:** ve Frameru je to hotová komponenta; v Astru použijeme oficiální Strava embed nebo si ji postavíme. Máš Stravu propojenou, takže napojení přes API je taky možnost.
- **Editor lokálně:** dokud běžíme jen lokálně, články se ukládají u tebe na disku. Po nasazení půjde editovat i online.

---

## Co potřebuju od tebe k dalšímu kroku
Nic nutného hned. Až řekneš, **začnu Fází 1** — založím lokální Astro projekt a postavím základní design, ať máš co nejdřív co vidět. Než se pustím, dobré vědět:

- Jestli máš na počítači **Node.js** (potřeba pro lokální běh) — pokud ne, poradím s instalací.
- Jestli chceš vzhled **držet co nejblíž** současnému, nebo to vzít jako příležitost na drobné vylepšení.

# veselestopy.cz

Běžecký blog Jana Veselého. Postaveno na [Astro](https://astro.build) + Tailwind CSS. Náhrada za Framer — bez měsíčního poplatku.

## Spuštění lokálně

Potřebuješ nainstalovaný **Node.js** (verze 18.20+, 20.3+ nebo 22+).

```bash
npm install      # jednorázově: nainstaluje závislosti
npm run dev      # spustí web na http://localhost:4321
```

Při psaní `npm run dev` se web automaticky obnovuje při každé změně.

## Užitečné příkazy

| Příkaz            | Co dělá                                              |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | vývojový server na `localhost:4321`                 |
| `npm run cms`     | web + **vizuální editor** na `localhost:4321/admin` |
| `npm run build`   | sestaví hotový web do složky `dist/`                |
| `npm run preview` | náhled sestaveného webu                             |

## Vizuální editor (TinaCMS)

Pro psaní článků „klikací" cestou s náhledem:

```bash
npm run cms
```

Pak otevři **http://localhost:4321/admin** (běží lokálně, bez přihlašování).
Vybereš kolekci *Články*, kde můžeš psát, formátovat, nahrávat obrázky a měnit
kategorie. Vše se ukládá rovnou do Markdown souborů v `src/content/clanky/`.

## Kde co je

```
src/
├─ content/clanky/        # ČLÁNKY (Markdown soubory) — sem se píše obsah
├─ data/
│  ├─ site.ts             # název, autor, sociální sítě, partneři
│  └─ categories.ts       # kategorie blogu
├─ components/            # stavební bloky (hlavička, karty, patička…)
├─ layouts/               # společný layout stránek
├─ pages/                 # jednotlivé stránky a routy
└─ styles/global.css      # barvy, fonty, globální styly
public/                    # obrázky a statické soubory
```

## Psaní článků

Každý článek je jeden soubor `.md` ve složce `src/content/clanky/`. Název souboru = adresa článku (např. `muj-clanek.md` → `/clanky/muj-clanek`).

Hlavička článku (frontmatter):

```yaml
---
title: "Název článku"
description: "Krátký popisek do výpisu a pro SEO."
date: 2026-06-22
category: "zavody"          # zavody | tydenni-report | zlomit-3-hodiny | recenze
badge: "Nový článek"         # volitelné
cover: "/images/foto.jpg"    # volitelný úvodní obrázek
readingMinutes: 6            # volitelné
draft: false                 # true = nezobrazí se na webu
---

Tady začíná text článku v Markdownu…
```

Vizuální editor (TinaCMS) se doplní v dalším kroku — pak půjde psát „klikací" cestou s náhledem.

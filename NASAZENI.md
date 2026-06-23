# Nasazení veselestopy.cz (Cloudflare Pages + Tina Cloud)

Cíl: dostat web online na Cloudflare Pages, zapnout online editaci přes Tina Cloud
(přihlášení, funguje z obou počítačů) a nakonec přepnout doménu `veselestopy.cz`
z Frameru. Vše ve free tieru.

Postupuj po krocích. Lokální psaní přes `npm run cms` funguje pořád stejně.

---

## 0. Příprava na Macu (Git)

V projektu zůstal nedokončený `.git` z přípravy (kvůli omezení prostředí). Začni
čistě – v terminálu ve složce projektu:

```bash
cd ~/Claude/Projects/veselestopy.cz
rm -rf .git                      # odstraní nedokončený repozitář
git init
git add -A
git commit -m "Web veselestopy.cz – Astro + TinaCMS"
```

> `node_modules`, `dist`, `public/admin` a generované soubory se díky `.gitignore`
> do Gitu nedostanou – to je správně.

---

## 1. GitHub (úložiště kódu)

1. Pokud nemáš účet, založ si ho na <https://github.com> (zdarma).
2. Vytvoř nový **prázdný** repozitář (tlačítko **New**), např. `veselestopy`.
   - Nech ho bez README a .gitignore (ať se nepřekrývá s tím tvým).
3. Připoj a nahraj svůj kód (GitHub ti přesné příkazy ukáže; budou vypadat takhle):

```bash
git branch -M main
git remote add origin https://github.com/TVUJ-UCET/veselestopy.git
git push -u origin main
```

> Při pushi budeš vyzván k přihlášení (GitHub login / token). To dělej ty.

---

## 2. Cloudflare Pages (hosting + build)

1. Účet zdarma na <https://dash.cloudflare.com>.
2. **Workers & Pages → Create → Pages → Connect to Git** → vyber repozitář
   `veselestopy`.
3. Nastavení buildu:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** přidej `NODE_VERSION` = `22`
4. **Save and Deploy.** Po pár minutách dostaneš adresu typu
   `https://veselestopy.pages.dev`.
5. **Zkontroluj web na téhle adrese** – musí vypadat a fungovat jako lokálně.

> V tuhle chvíli web běží, ale ještě bez online editoru. Editovat můžeš lokálně
> (`npm run cms`), pushnout změnu na GitHub a Cloudflare web sám přebuilduje.

---

## 3. Tina Cloud (online editace s přihlášením)

1. Účet zdarma na <https://app.tina.io> (přihlas se přes GitHub).
2. **Create Project** → propoj se svým GitHub repozitářem `veselestopy`,
   branch `main`.
3. Tina ti vygeneruje dvě hodnoty:
   - **Client ID**
   - **Token** (read-only content token)
4. V Cloudflare Pages (projekt → **Settings → Environment variables**) přidej:
   - `TINA_CLIENT_ID` = (Client ID z Tiny)
   - `TINA_TOKEN` = (Token z Tiny)
   - (`NODE_VERSION` = `22` už tam je)
5. Změň **Build command** na: `npm run build:cms`
   (tím se při buildu vygeneruje i přihlášené admin rozhraní).
6. Spusť nový deploy (**Deployments → Retry / Create deployment**).
7. Otevři `https://veselestopy.pages.dev/admin/index.html` → mělo by tě to vyzvat
   k **přihlášení přes Tina Cloud**. Po přihlášení edituješ online a uložení vytvoří
   commit do GitHubu → Cloudflare web přebuilduje.

> Tím je vyřešená bezpečnost: do `/admin` se dostane jen přihlášený (ty), náhodný
> návštěvník ne. Lokálně `npm run cms` dál běží v local módu bez přihlášení.

---

## 4. Přepnutí domény veselestopy.cz

Nejdřív ověř, že web na `*.pages.dev` funguje. Teprve pak přepínej doménu.

1. V Cloudflare Pages: projekt → **Custom domains → Set up a custom domain** →
   zadej `veselestopy.cz` (a případně `www.veselestopy.cz`).
2. Cloudflare ti řekne, jaký **DNS záznam** nastavit (CNAME na `pages.dev`), nebo
   tě vyzve **převést doménu pod Cloudflare** (změna nameserverů u registrátora).
3. Tu změnu provedeš **u svého registrátora** (kde máš doménu vedenou). DNS změny
   se projeví obvykle do pár hodin (max 24–48 h).
4. Až web pojede na `veselestopy.cz`, **zruš předplatné Frameru**.

> Pozor na pořadí: jakmile DNS ukáže na Cloudflare, starý Framer web přestane být
> na doméně vidět. Proto nejdřív ověř Cloudflare verzi na `.pages.dev`.

---

## 5. Druhý počítač / běžný provoz

- **Online editace:** jen otevři `veselestopy.cz/admin/index.html`, přihlas se → píšeš
  odkudkoliv, z obou počítačů.
- **Lokální úpravy (volitelně):** na druhém počítači si projekt stáhni:
  ```bash
  git clone https://github.com/TVUJ-UCET/veselestopy.git
  cd veselestopy
  npm install
  npm run cms
  ```
- Po lokální změně: `git add -A && git commit -m "..." && git push` → web se sám
  zaktualizuje.

---

## Poznámky / řešení potíží

- **Build na Cloudflare spadne na verzi Node** → zkontroluj `NODE_VERSION=22`.
- **/admin hlásí chybu po zapnutí cloudu** → zkontroluj, že `TINA_CLIENT_ID` a
  `TINA_TOKEN` jsou v Cloudflare a build command je `npm run build:cms`.
- **Obrázky stránky O mně a loga partnerů Mizuno/FyzioFit** se zatím načítají z
  Framer CDN. Až bude web stát, můžeme je stáhnout lokálně, ať na Frameru vůbec
  nezávisíme (rozšíření migračního skriptu).
- **Diakritika v jednom starém článku** (`jarni-slunce-...`) – původní URL měla
  diakritiku, nová je bez ní. Když budeš chtít, doplníme přesměrování.

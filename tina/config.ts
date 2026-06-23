import { defineConfig } from "tinacms";

// Lokální režim: bez clientId/tokenu běží TinaCMS čistě nad soubory v projektu.
// Spuštění: `npm run cms` → editor na http://localhost:4321/admin/index.html

const categoryOptions = [
  { value: "zavody", label: "Závody" },
  { value: "tydenni-report", label: "Týdenní report" },
  { value: "zlomit-3-hodiny", label: "Zlomit3Hodiny" },
  { value: "recenze", label: "Recenze" },
];

// Lokálně (npm run cms) jsou proměnné prázdné → editor běží v local módu nad soubory.
// Na Cloudflare nastavíme TINA_CLIENT_ID a TINA_TOKEN → editor poběží přes Tina Cloud
// s přihlášením a ukládá změny commitem do Gitu.
const branch =
  process.env.TINA_BRANCH ||
  process.env.CF_PAGES_BRANCH ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID ?? "",
  token: process.env.TINA_TOKEN ?? "",
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "clanky",
        label: "Články",
        path: "src/content/clanky",
        format: "md",
        ui: {
          filename: {
            // název souboru = slug z názvu (bez diakritiky), zkrácený na ~60 znaků
            slugify: (values) => {
              const base = (values?.title || "clanek")
                .toString()
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              const MAX = 60;
              if (base.length <= MAX) return base;
              const cut = base.slice(0, MAX);
              const lastDash = cut.lastIndexOf("-");
              // ořízni na hranici slova (pokud dává smysl)
              return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(
                /-+$/,
                "",
              );
            },
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Název",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Popisek (do výpisu a SEO)",
            ui: { component: "textarea" },
          },
          {
            type: "datetime",
            name: "date",
            label: "Datum publikace",
            required: true,
          },
          {
            type: "string",
            name: "categories",
            label: "Kategorie",
            list: true,
            options: categoryOptions,
            description: "První kategorie = primární (zobrazí se na kartě).",
          },
          {
            type: "image",
            name: "cover",
            label: "Úvodní obrázek",
          },
          {
            type: "number",
            name: "readingMinutes",
            label: "Doba čtení (min)",
          },
          {
            type: "string",
            name: "badge",
            label: "Štítek nad nadpisem (volitelné)",
          },
          {
            type: "boolean",
            name: "featured",
            label: "Hlavní článek (velké místo pod hero)",
            description:
              "Když je zaškrtnuto u více článků, použije se nejnovější z nich.",
          },
          {
            type: "boolean",
            name: "sidebar",
            label: "Zobrazit pravý sidebar (partneři apod.)",
            description: "Vypnuto = článek vycentrovaný bez sidebaru.",
          },
          {
            type: "boolean",
            name: "draft",
            label: "Koncept (nezveřejní se)",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Obsah článku",
            isBody: true,
          },
        ],
      },
    ],
  },
});

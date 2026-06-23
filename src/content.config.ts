import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// Články blogu
const clanky = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/clanky" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    // slugy kategorií (viz src/data/categories.ts); první = primární
    categories: z.array(z.string()).default([]),
    // volitelný štítek nad nadpisem, např. "Nový článek" / "Zranění"
    badge: z.string().optional(),
    // cesta k úvodnímu obrázku (/images/...) nebo URL
    cover: z.string().optional(),
    readingMinutes: z.number().optional(),
    // ručně označit jako hlavní článek (velké místo pod hero)
    featured: z.boolean().default(false),
    // zobrazit u článku pravý sidebar (partneři apod.); jinak vycentrovaný
    sidebar: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { clanky };

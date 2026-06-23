// Kategorie blogu — slug odpovídá poli `category` ve článcích
export interface Category {
  slug: string;
  title: string;
  label: string; // krátký štítek na kartě
  description: string;
  icon: string; // ilustrovaná ikona kategorie
}

export const categories: Category[] = [
  {
    slug: "zavody",
    title: "Závody",
    label: "Závody",
    description: "Reporty a příběhy ze závodů.",
    icon: "https://framerusercontent.com/images/aj1aEikeulV97JQYPi7PagtAP8.jpeg",
  },
  {
    slug: "tydenni-report",
    title: "Týdenní report tréninkového týdne",
    label: "Týdenní report",
    description: "Co se dělo v tréninku týden po týdnu.",
    icon: "https://framerusercontent.com/images/v79of0m6ZhOJ5BijMJEUnZQl0sk.jpeg",
  },
  {
    slug: "zlomit-3-hodiny",
    title: "Maraton pod 3 hodiny",
    label: "Zlomit3Hodiny",
    description: "Cesta za maratonem pod tři hodiny.",
    icon: "https://framerusercontent.com/images/Bdgo8gAXLLpWGizWW4bPtG1LDfo.jpeg",
  },
  {
    slug: "recenze",
    title: "Recenze",
    label: "Recenze",
    description: "Recenze běžeckého vybavení a doplňků.",
    icon: "https://framerusercontent.com/images/iARlCvlAVCqXDJKNLzCTx3xLJY.jpeg",
  },
];

export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.slug, c]),
);

export function getCategory(slug: string): Category | undefined {
  return categoryMap[slug];
}

import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { site } from "../data/site";

export async function GET(context: APIContext) {
  const articles = (
    await getCollection("clanky", ({ data }) => !data.draft)
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? "https://veselestopy.cz",
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description ?? "",
      pubDate: a.data.date,
      link: `/clanky/${a.id}/`,
    })),
  });
}

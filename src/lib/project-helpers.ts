import type { ProjectWithRelations } from "@/lib/content";

export type HeroCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  year: string;
  shortDescription: string;
  accent: string;
  thumbnail: {
    id: string;
    url: string;
    kind: string;
    width: number | null;
    height: number | null;
    alt: string;
  } | null;
};

export function heroProjectsToCards(projects: ProjectWithRelations[]): HeroCard[] {
  return projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    year: p.year,
    shortDescription: p.shortDescription,
    accent: p.accent,
    thumbnail: p.thumbnail
      ? {
          id: p.thumbnail.id,
          url: p.thumbnail.url,
          kind: p.thumbnail.kind,
          width: p.thumbnail.width,
          height: p.thumbnail.height,
          alt: p.thumbnail.alt,
        }
      : null,
  }));
}

export function mediaLight(media: { id: string; url: string; kind: string; width: number | null; height: number | null; alt: string } | null | undefined) {
  if (!media) return null;
  return { id: media.id, url: media.url, kind: media.kind, width: media.width, height: media.height, alt: media.alt };
}
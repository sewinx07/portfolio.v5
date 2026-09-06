import { cache } from "react";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/validation";
import { DEFAULT_HOMEPAGE, DEFAULT_ABOUT } from "@/lib/constants";

export type HomepageContent = {
  heroKicker: string;
  heroLabel: string;
  heroHeadline: string;
  heroRoles: string[];
  heroStatement: string;
  heroCtaLabel: string;
  storyTitle: string;
  storyParagraph: string;
  storyPoints: Array<{ label: string; text: string }>;
  aboutPreviewTitle: string;
  aboutPreviewText: string;
  skillsTitle: string;
  skills: Array<{ group: string; items: string[] }>;
  contactHeadline: string;
  contactSub: string;
  finalHeadline: string;
  finalAccent: string;
};

export type AboutContent = {
  name: string;
  role: string;
  introLabel: string;
  intro: string;
  pullQuote: string;
  bioTitle: string;
  bio: string;
  infoTitle: string;
  location: string;
  available: string;
  languages: string;
  experienceTitle: string;
  experience: Array<{ period: string; role: string; org: string; text: string }>;
  educationTitle: string;
  education: Array<{ period: string; degree: string; org: string; text: string }>;
  servicesTitle: string;
  services: Array<{ title: string; text: string }>;
  profileNote: string;
};

export const getSite = cache(async () => {
  const settings = await db.siteSettings.findUnique({ where: { id: "site" } });
  return settings;
});

export const getNav = cache(async () => {
  const items = await db.navItem.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
  return items;
});

export const getSocials = cache(async () => {
  return db.socialLink.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
});

export const getHomepage = cache(async (): Promise<HomepageContent> => {
  const page = await db.pageContent.findUnique({ where: { key: "homepage" } });
  const data = parseJson(page?.content ?? "{}", {});
  return { ...DEFAULT_HOMEPAGE, ...data } as unknown as HomepageContent;
});

export const getAbout = cache(async (): Promise<AboutContent> => {
  const page = await db.pageContent.findUnique({ where: { key: "about" } });
  const data = parseJson(page?.content ?? "{}", {});
  return { ...DEFAULT_ABOUT, ...data } as unknown as AboutContent;
});

export const getContactPage = cache(async () => {
  const page = await db.pageContent.findUnique({ where: { key: "contact" } });
  const data = parseJson(page?.content ?? "{}", { headline: "", sub: "" });
  return data;
});

export const getTechnologies = cache(async () => {
  return db.technology.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
});

export const projectInclude = {
  thumbnail: true,
  heroMedia: true,
  technologies: { include: { technology: true }, orderBy: { order: "asc" } },
  gallery: { include: { mediaItem: true }, orderBy: { order: "asc" } },
  sections: { orderBy: { order: "asc" } },
} as const;

export type ProjectWithRelations = NonNullable<
  Awaited<ReturnType<typeof getPublishedProject>>
>;

export const getPublishedProject = cache(async (slug: string) => {
  return db.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: projectInclude,
  });
});

export const getPublishedProjects = cache(async (opts?: { featuredOnly?: boolean }) => {
  const where = {
    status: "PUBLISHED" as const,
    ...(opts?.featuredOnly ? { featured: true } : {}),
  };
  return db.project.findMany({
    where,
    include: projectInclude,
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });
});

export const getMediaByIds = cache(async (ids: string[]) => {
  if (ids.length === 0) return [];
  return db.mediaItem.findMany({ where: { id: { in: ids } } });
});

export const getProjectMeta = cache(async (slug: string) => {
  return db.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      shortDescription: true,
      metaTitle: true,
      metaDescription: true,
      category: true,
      thumbnail: true,
      id: true,
    },
  });
});
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = await db.project.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  const routes: MetadataRoute.Sitemap = [
    { url: `${url}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${url}/work`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${url}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${url}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...published.map((p) => ({
      url: `${url}/work/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  return routes;
}
import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/content";
import { heroProjectsToCards } from "@/lib/project-helpers";
import { ArcGallery } from "@/components/work/ArcGallery";
import { PageReveal } from "@/components/public/PageReveal";
import { TrackView } from "@/components/public/TrackView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work — Selected Projects",
  description: "A selection of projects spanning web experiences, interfaces, branding and motion.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const projects = await getPublishedProjects();

  return (
    <PageReveal>
      <TrackView />
      <ArcGallery projects={heroProjectsToCards(projects)} standalone />
    </PageReveal>
  );
}
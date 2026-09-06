import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProject, getPublishedProjects } from "@/lib/content";
import { heroProjectsToCards } from "@/lib/project-helpers";
import { CaseStudy } from "@/components/work/CaseStudy";
import { NextProject } from "@/components/work/NextProject";
import { PageReveal } from "@/components/public/PageReveal";
import { TrackView } from "@/components/public/TrackView";
import { MediaAsset } from "@/components/public/MediaAsset";
import { BackButton } from "@/components/work/BackButton";
import { mediaLight } from "@/lib/project-helpers";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.metaTitle || project.title,
    description: project.metaDescription || project.shortDescription || project.description,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: project.title,
      description: project.shortDescription,
      images: project.thumbnail ? [{ url: project.thumbnail.url }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getPublishedProject(slug), getPublishedProjects()]);
  if (!project) notFound();

  const cards = heroProjectsToCards(all);
  const myIndex = cards.findIndex((c) => c.slug === slug);
  const next = cards[(myIndex + 1) % cards.length] ?? null;

  const techs = project.technologies.map((t) => t.technology.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.shortDescription || project.description,
    image: project.thumbnail?.url,
    dateCreated: project.publishedAt,
    keywords: techs,
  };

  return (
    <PageReveal>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView slug={slug} />
      <article className="case-page">
        <header className="case-hero">
          <div className="container case-kicker">
            <span className="label">
              WORK — 0{String(myIndex + 1).padStart(1, "0")} / {String(cards.length).padStart(2, "0")}
            </span>
            <BackButton />
          </div>

          <div className="container case-title-wrap">
            <h1 className="case-title h1">{project.title}</h1>
            {project.tagline && <p className="lead case-title-tag">{project.tagline}</p>}
          </div>

          <div className="case-meta-strip hairline-t">
            <Meta label="CATEGORY" value={project.category} />
            <Meta label="YEAR" value={project.year || "—"} />
            <Meta label="CLIENT" value={project.client || "—"} />
            <Meta label="ROLE" value={project.role} />
          </div>

          {project.heroMedia && (
            <div className="case-hero-media media-frame">
              <MediaAsset media={mediaLight(project.heroMedia)} fill priority sizes="100vw" />
            </div>
          )}

          {project.shortDescription && (
            <div className="container case-intro">
              <p className="lead">{project.shortDescription}</p>
              {project.description && <p className="case-intro-ext">{project.description}</p>}
            </div>
          )}

          <div className="container case-tech-hint">
            <span className="label">{techs.length ? techs.join(" · ") : "———"}</span>
          </div>
        </header>

        <div className="case-body container">
          <CaseStudy sections={project.sections.map((s) => ({ id: s.id, type: s.type, title: s.title, content: s.content, data: s.data }))} />
        </div>
      </article>

      <NextProject project={next} index={myIndex} total={cards.length} />
    </PageReveal>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="case-meta-item">
      <span className="label">{label}</span>
      <span className="case-meta-value">{value}</span>
    </div>
  );
}
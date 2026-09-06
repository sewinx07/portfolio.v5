import type { Metadata } from "next";
import { getHomepage, getPublishedProjects } from "@/lib/content";
import { heroProjectsToCards } from "@/lib/project-helpers";
import { Hero } from "@/components/home/Hero";
import { ArcGallery } from "@/components/work/ArcGallery";
import {
  StorySection,
  AboutPreviewSection,
  SkillsSection,
  ContactCta,
  FinalSection,
} from "@/components/home/HomeSections";
import { PageReveal } from "@/components/public/PageReveal";
import { TrackView } from "@/components/public/TrackView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Taha Gmir — Creative Developer & Designer",
  description:
    "Taha Gmir designs and engineers cinematic digital experiences across web, interface and motion.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [home, projects] = await Promise.all([getHomepage(), getPublishedProjects({ featuredOnly: true })]);
  const cards = heroProjectsToCards(projects.length ? projects : (await getPublishedProjects()));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Taha Gmir",
    url: "/",
    description: home.heroStatement,
  };

  return (
    <PageReveal>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView />
      <Hero
        kicker={home.heroKicker}
        label={home.heroLabel}
        roles={home.heroRoles}
        statement={home.heroStatement}
        cta={home.heroCtaLabel}
      />
      <ArcGallery projects={cards} />
      <StorySection title={home.storyTitle} paragraph={home.storyParagraph} points={home.storyPoints} />
      <AboutPreviewSection title={home.aboutPreviewTitle} text={home.aboutPreviewText} />
      <SkillsSection title={home.skillsTitle} skills={home.skills} />
      <ContactCta headline={home.contactHeadline} sub={home.contactSub} />
      <FinalSection
        headline={home.finalHeadline}
        kicker={"SITE LOG — MMXXVI"}
        accent={home.finalAccent}
      />
    </PageReveal>
  );
}
import type { Metadata } from "next";
import { getHomepage, getAbout } from "@/lib/content";
import { db } from "@/lib/db";
import { PagesEditor, type HomepageShape, type AboutShape } from "@/components/admin/PagesEditor";

export const metadata: Metadata = {
  title: "Pages",
  robots: { index: false },
};

export default async function AdminPagesPage() {
  const [homepage, about, contact] = await Promise.all([
    getHomepage(),
    getAbout(),
    db.pageContent.findUnique({ where: { key: "contact" } }),
  ]);

  const homepageData: HomepageShape = {
    heroKicker: homepage.heroKicker,
    heroLabel: homepage.heroLabel,
    heroHeadline: homepage.heroHeadline,
    heroRoles: homepage.heroRoles ?? [],
    heroStatement: homepage.heroStatement,
    heroCtaLabel: homepage.heroCtaLabel,
    storyTitle: homepage.storyTitle,
    storyParagraph: homepage.storyParagraph,
    storyPoints: homepage.storyPoints ?? [],
    aboutPreviewTitle: homepage.aboutPreviewTitle,
    aboutPreviewText: homepage.aboutPreviewText,
    skillsTitle: homepage.skillsTitle,
    skills: homepage.skills ?? [],
    contactHeadline: homepage.contactHeadline,
    contactSub: homepage.contactSub,
    finalHeadline: homepage.finalHeadline,
    finalAccent: homepage.finalAccent,
  };

  const aboutData: AboutShape = {
    name: about.name,
    role: about.role,
    introLabel: about.introLabel,
    intro: about.intro,
    pullQuote: about.pullQuote,
    bioTitle: about.bioTitle,
    bio: about.bio,
    infoTitle: about.infoTitle,
    location: about.location,
    available: about.available,
    languages: about.languages,
    experienceTitle: about.experienceTitle,
    experience: about.experience ?? [],
    educationTitle: about.educationTitle,
    education: about.education ?? [],
    servicesTitle: about.servicesTitle,
    services: about.services ?? [],
    profileNote: about.profileNote,
  };

  const contactData = contact ? JSON.parse(contact.content) : { headline: "", sub: "" };

  return (
    <PagesEditor
      homepage={homepageData}
      about={aboutData}
      contact={{
        headline: String(contactData.headline ?? ""),
        sub: String(contactData.sub ?? ""),
      }}
    />
  );
}
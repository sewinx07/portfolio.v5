import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env so ADMIN_EMAIL / ADMIN_PASSWORD / DATABASE_URL are deterministic
// when this script runs directly (node prisma/seed.mjs). Existing env vars win
// over the file, so callers may still override everything explicitly.
try {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  if (typeof process.loadEnvFile === "function") process.loadEnvFile(envPath);
} catch {}

const prisma = new PrismaClient();
const uploadDir = path.join(process.cwd(), "public", "uploads", "seed");

const log = (msg) => console.log(`[seed] ${msg}`);

const j = (v) => (typeof v === "string" ? v : JSON.stringify(v ?? {}));

// ---------------------------------------------------------------- helpers

function poster(name, title, index, accent = "#111111", bg = "#F4F2EE") {
  const variants = [
    `M0,0 L${720 * 0.35},0 L0,${720 * 0.35} Z`,
    `M720,0 L720,${720 * 0.4} L${720 * 0.6},0 Z`,
    `M0,720 L${720 * 0.42},720 L0,${720 * 0.58} Z`,
    `M720,720 L${720 * 0.58},720 L720,${720 * 0.42} Z`,
  ];
  const clip = variants[index % variants.length];
  const label = `TAHA GMIR — ${String(index + 1).padStart(2, "0")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <rect width="1440" height="900" fill="${bg}"/>
  <clipPath id="c"><path d="${clip}"/></clipPath>
  <g clip-path="url(#c)"><rect width="1440" height="900" fill="${accent}"/></g>
  <rect x="64" y="64" width="1312" height="772" fill="none" stroke="#111111" stroke-opacity="0.15"/>
  <text x="72" y="120" font-family="ui-monospace, monospace" font-size="22" letter-spacing="6" fill="#111111" fill-opacity="0.5">${label}</text>
  <g transform="translate(72 620)">
    <line x1="0" y1="0" x2="180" y2="0" stroke="#111111" stroke-width="2"/>
    <text y="34" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="72" letter-spacing="-2" fill="#111111">${title}</text>
    <text y="78" font-family="ui-monospace, monospace" font-size="24" letter-spacing="8" fill="#111111" fill-opacity="0.65">NEW WORK — ${String(index + 1).padStart(2, "0")}</text>
  </g>
</svg>`;
}

async function saveMedia(filename, svg, alt) {
  const full = path.join(uploadDir, filename);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, svg);
  const size = Buffer.byteLength(svg);
  const url = `/uploads/seed/${filename}`;
  return prisma.mediaItem.upsert({
    where: { id: filename.replace(/\.svg$/, "-media") },
    update: { url, size, alt },
    create: {
      id: filename.replace(/\.svg$/, "-media"),
      filename,
      url,
      kind: "SVG",
      mimeType: "image/svg+xml",
      size,
      width: 1440,
      height: 900,
      alt,
    },
  });
}

async function ensureTech(name, category) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return prisma.technology.upsert({
    where: { slug },
    update: { category },
    create: { name, slug, category },
  });
}

// ---------------------------------------------------------------- main

async function main() {
  log("Clearing CMS-managed content (users / media unaffected)...");
  await prisma.revision.deleteMany();
  await prisma.projectSection.deleteMany();
  await prisma.projectMedia.deleteMany();
  await prisma.projectTechnology.deleteMany();
  await prisma.project.deleteMany();
  await prisma.technology.deleteMany();
  await prisma.navItem.deleteMany();
  await prisma.socialLink.deleteMany();
  await prisma.aIKnowledge.deleteMany();

  // --- admin user
  const email = process.env.ADMIN_EMAIL || "admin@tahagmir.com";
  const rawPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(5).toString("hex");
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Taha Gmir", passwordHash, role: "ADMIN" },
  });
  log(`Admin ready → ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    log(`Generated admin password: ${rawPassword}`);
    log(`Copy it now — it won't be shown again. Change it in production.`);
  }

  // --- technologies
  const techDefs = [
    ["React", "Development"], ["Next.js", "Development"], ["TypeScript", "Development"],
    ["Prisma", "Development"], ["PostgreSQL", "Development"], ["Node.js", "Development"],
    ["Motion", "Development"], ["CSS3", "Development"], ["HTML5", "Development"],
    ["Sharp", "Tools"], ["Figma", "Design"], ["Photoshop", "Design"],
    ["Illustrator", "Design"], ["After Effects", "Motion"], ["Three.js", "Development"],
    ["Premiere Pro", "Motion"],
  ];
  const techs = {};
  for (const [name, cat] of techDefs) techs[name] = await ensureTech(name, cat);

  // --- posters (public showcase + sample drafts)
  const p1 = await saveMedia("portfolio-poster-main.svg", poster("portfolio-poster-main.svg", "A CINEMATIC CMS", 0, "#101012"), "Portfolio poster");
  const p2 = await saveMedia("portfolio-poster-detail.svg", poster("portfolio-poster-detail.svg", "EXPERIENCE ENGINE", 1, "#3C2F27"), "Experience engine detail poster");
  const film = await saveMedia("film-poster.svg", poster("film-poster.svg", "VISUAL ESSAYS", 2, "#4A1F1F"), "Film poster");
  const brand = await saveMedia("brand-poster.svg", poster("brand-poster.svg", "SYSTEMS & IDENTITY", 3, "#16324A"), "Brand poster");

  // --- site settings
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      title: "Taha Gmir",
      tagline: "Creative Developer & Digital Experience Builder",
      description:
        "Taha Gmir is a creative developer, designer and visual storyteller building cinematic digital experiences.",
      contactEmail: "hello@tahagmir.com",
      footerText: "Designed & engineered by Taha Gmir.",
      analyticsEnabled: true,
    },
  });

  // --- navigation
  const navDefs = [
    { label: "WORK", href: "/work", order: 0 },
    { label: "ABOUT", href: "/about", order: 1 },
    { label: "CONTACT", href: "/contact", order: 2 },
  ];
  for (const n of navDefs) {
    await prisma.navItem.create({ data: { ...n, visible: true } });
  }

  // --- socials
  const socialDefs = [
    { label: "GitHub", url: "https://github.com/", order: 0 },
    { label: "LinkedIn", url: "https://www.linkedin.com/", order: 1 },
    { label: "Instagram", url: "https://instagram.com/", order: 2 },
    { label: "Behance", url: "https://www.behance.net/", order: 3 },
  ];
  for (const s of socialDefs) {
    await prisma.socialLink.create({ data: { ...s, visible: true } });
  }

  // --- page contents
  await prisma.pageContent.upsert({
    where: { key: "homepage" },
    update: {},
    create: {
      key: "homepage",
      title: "Home",
      content: JSON.stringify({
        heroKicker: "TAHA GMIR",
        heroLabel: "PORTFOLIO — MMXXVI",
        heroHeadline: "I design and engineer digital experiences.",
        heroRoles: ["Creative Developer", "Designer", "Digital Experience Builder", "Motion & Film"],
        heroStatement: "DESIGN. CODE. EXPERIENCE.",
        heroCtaLabel: "SEE THE WORK",
        storyTitle: "THE OVERLAP",
        storyParagraph:
          "Most studios separate design from development. My work lives in the space between them — interfaces that are engineered like products and designed like stories.",
        storyPoints: [
          { label: "01 — ART DIRECTION", text: "Every interface starts with a concept, a voice and a composition — not a component library." },
          { label: "02 — ENGINEERING", text: "Design comes alive through clean code, fast rendering and deliberate motion." },
          { label: "03 — CRAFT", text: "Typography, pacing and detail are load-bearing — not decoration." },
        ],
        aboutPreviewTitle: "ABOUT",
        aboutPreviewText:
          "Taha Gmir is a creative developer, designer and visual storyteller working across web, interface and motion — building experiences that are meant to be remembered.",
        skillsTitle: "CAPABILITIES",
        contactHeadline: "LET'S BUILD SOMETHING WORTH EXPERIENCING.",
        contactSub:
          "If you have a product, brand or story that deserves a considered digital experience — let's talk.",
        finalHeadline: "THANKS FOR EXPERIENCING THE WORK.",
        finalAccent: "TAHA GMIR",
      }),
    },
  });

  await prisma.pageContent.upsert({
    where: { key: "about" },
    update: {},
    create: {
      key: "about",
      title: "About",
      content: JSON.stringify({
        name: "Taha Gmir",
        role: "Creative Developer & Designer",
        introLabel: "ABOUT",
        intro:
          "I build digital experiences at the intersection of design, engineering and storytelling. The interface is a medium — something to be composed, sequenced and felt, not just browsed.",
        pullQuote:
          "A website should feel designed the way a film is directed — with intention in every frame.",
        bioTitle: "BIO",
        bio:
          "I'm a creative developer and designer working across web platforms, interfaces and motion. I care about the details most people notice only in their absence: type that breathes, motion that means something, and structure that makes content effortless to move through.\n\nI approach each project as an environment rather than a page — designing the atmosphere, the rhythm and the interaction model before a single component is written.\n\nWhen I'm not building digital experiences, I'm thinking in frames: cutting video, animating type and studying how light, movement and pacing shape attention.",
        infoTitle: "INFO",
        location: "Based in — [your city]",
        available: "Available for select projects",
        languages: "English · Arabic · French",
        experienceTitle: "EXPERIENCE",
        experience: [
          {
            period: "2023 — Present",
            role: "Creative Developer & Designer",
            org: "Independent",
            text: "Designing and engineering websites, interfaces and motion for clients and personal projects.",
          },
        ],
        educationTitle: "EDUCATION",
        education: [
          {
            period: "—",
            degree: "Design & Computer Science",
            org: "[Your institution]",
            text: "",
          },
        ],
        servicesTitle: "SERVICES",
        services: [
          { title: "Web Design & Development", text: "Concept, design and code for performant, memorable websites." },
          { title: "Creative Development", text: "Interactive experiences, motion and editorial interfaces." },
          { title: "Brand & Visual Identity", text: "Logos, typography, visual systems and campaign art direction." },
          { title: "Motion & Video", text: "Motion design, video editing and cinematic post-production." },
        ],
      }),
    },
  });

  await prisma.pageContent.upsert({
    where: { key: "contact" },
    update: {},
    create: {
      key: "contact",
      title: "Contact",
      content: JSON.stringify({
        headline: "LET'S BUILD SOMETHING WORTH EXPERIENCING.",
        sub: "Tell me about the product, brand or story you want to bring to life.",
      }),
    },
  });

  // --- AI
  await prisma.aISettings.upsert({
    where: { id: "ai" },
    update: {},
    create: {
      id: "ai",
      enabled: true,
      name: "Taha AI",
      welcomeMessage:
        "Welcome to Taha's portfolio. Ask me about the projects, the design process or the technologies used — I can guide you to the right work.",
      suggestedQuestions: JSON.stringify([
        "What projects did Taha build with Next.js?",
        "Which project best shows his design work?",
        "What technologies does he use?",
        "Can he design and develop a full website?",
        "Tell me about the case studies.",
      ]),
    },
  });

  // --- showcase project: the platform itself
  const showcaseSectionData = [
    {
      type: "heading",
      title: "OVERVIEW",
      content: "What it is",
      order: 0,
    },
    {
      type: "paragraph",
      title: "",
      content:
        "This website is the flagship demonstration of the practice: a cinematic portfolio platform with a full private CMS and a portfolio-aware AI assistant. It is the project I would show first to explain what I mean by digital experience engineering — because it is built to experience, not to explain.",
      order: 1,
    },
    {
      type: "heading",
      title: "CHALLENGE",
      content: "The problem to solve",
      order: 2,
    },
    {
      type: "paragraph",
      title: "",
      content:
        "Most portfolios are either beautiful but static, or functional but templated. The challenge was to build a single platform where the public experience feels like a curated exhibition while the owner retains full editorial control — with no code edits required to publish new work.",
      order: 3,
    },
    {
      type: "quote",
      title: "",
      content: "The effects are not the portfolio. The projects are the portfolio.",
      data: { author: "Design principle behind this build" },
      order: 4,
    },
    {
      type: "image",
      title: "",
      content: "Hero poster",
      data: { mediaId: p1.id },
      order: 5,
    },
    {
      type: "heading",
      title: "DEVELOPMENT",
      content: "How it's engineered",
      order: 6,
    },
    {
      type: "paragraph",
      title: "",
      content:
        "Next.js 15 App Router serves the public site as dynamic server-rendered pages backed by Prisma + PostgreSQL on Neon. Motion drives the cinematic transitions and scroll-linked project depth. Unauthenticated visitors get SEO-ready HTML; the owner gets an authenticated CMS with drafts, revisions and explicit publishing. Media is processed with Sharp and optimized to WebP.",
      order: 7,
    },
    {
      type: "technologies",
      title: "STACK",
      content: "",
      data: {
        items: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Motion", "Sharp"],
      },
      order: 8,
    },
    {
      type: "statistics",
      title: "SYSTEM",
      content: "",
      data: {
        items: [
          { label: "Public routes", value: "6" },
          { label: "Admin modules", value: "9" },
          { label: "Content models", value: "15" },
          { label: "Media pipeline", value: "1-way" },
        ],
      },
      order: 9,
    },
    {
      type: "gallery",
      title: "GALLERY",
      content: "",
      data: { mediaIds: [p1.id, p2.id] },
      order: 10,
    },
    {
      type: "heading",
      title: "RESULT",
      content: "What it delivers",
      order: 11,
    },
    {
      type: "paragraph",
      title: "",
      content:
        "A platform where the portfolio is easy to maintain and powerful to experience. The owner edits content without touching code; visitors move through projects like frames of a film; and the built-in AI guides both to the right place.",
      order: 12,
    },
  ];

  const showcase = await prisma.project.create({
    data: {
      title: "The Portfolio — A Cinematic CMS",
      slug: "cinematic-portfolio-cms",
      tagline: "A portfolio platform that is also the proof of the practice.",
      category: "Web Experience / CMS",
      year: "2026",
      client: "Self-initiated",
      role: "Concept, Design, Development, Motion",
      shortDescription:
        "A cinematic portfolio platform with a private CMS and a portfolio-aware AI assistant — built as both the product and its own best demonstration.",
      description:
        "A single platform that pairs a curated, cinematic public experience with a full private content management system and an AI guide.",
      accent: "#111111",
      status: "PUBLISHED",
      featured: true,
      order: 0,
      liveUrl: "",
      githubUrl: "",
      thumbnailId: p1.id,
      heroMediaId: p1.id,
      publishedAt: new Date(),
      technologies: {
        create: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Motion", "Sharp"].map((t, i) => ({
          technologyId: techs[t].id,
          order: i,
        })),
      },
      gallery: {
        create: [{ mediaItemId: p1.id, order: 0 }, { mediaItemId: p2.id, order: 1 }],
      },
      sections: {
        create: showcaseSectionData.map((s) => ({ ...s, data: j(s.data) })),
      },
    },
  });

  const snapshot = JSON.stringify(
    { ...showcase, sections: showcaseSectionData },
    null,
    0
  );
  await prisma.revision.create({
    data: {
      projectId: showcase.id,
      version: 1,
      note: "Initial publish",
      snapshot,
    },
  });
  log(`Published showcase project: ${showcase.title}`);

  // --- sample drafts (never surfaced publicly)
  const draftA = await prisma.project.create({
    data: {
      title: "Visual Essays — Film Series",
      slug: "visual-essays-film-series",
      tagline: "A sample draft. Edit or delete from the admin.",
      category: "Motion / Film",
      year: "",
      client: "",
      role: "",
      shortDescription: "A placeholder draft exploring a cinematic video essay series.",
      description: "",
      accent: "#4A1F1F",
      status: "DRAFT",
      featured: false,
      order: 1,
      thumbnailId: film.id,
      heroMediaId: film.id,
      technologies: { create: [{ technologyId: techs["After Effects"].id, order: 0 }] },
      sections: {
        create: [
          { type: "paragraph", title: "", content: "This is a draft placeholder. Replace the content or delete the project from the admin dashboard.", order: 0 },
        ],
      },
    },
  });
  const draftB = await prisma.project.create({
    data: {
      title: "Systems & Identity — Brand Study",
      slug: "systems-identity-brand-study",
      tagline: "A sample draft. Edit or delete from the admin.",
      category: "Design / Branding",
      year: "",
      client: "",
      role: "",
      shortDescription: "A placeholder draft for a brand identity study.",
      description: "",
      accent: "#16324A",
      status: "DRAFT",
      featured: false,
      order: 2,
      thumbnailId: brand.id,
      heroMediaId: brand.id,
      technologies: { create: [{ technologyId: techs["Figma"].id, order: 0 }] },
      sections: {
        create: [
          { type: "paragraph", title: "", content: "This is a draft placeholder. Replace the content or delete the project from the admin dashboard.", order: 0 },
        ],
      },
    },
  });
  log(`Draft samples ready: ${draftA.title} / ${draftB.title}`);

  log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
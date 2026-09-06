export const PROJECT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MESSAGE_STATUSES = ["NEW", "READ", "ARCHIVED"] as const;

export const SECTION_TYPES = [
  { id: "heading", label: "Heading", icon: "H" },
  { id: "paragraph", label: "Paragraph", icon: "¶" },
  { id: "image", label: "Image", icon: "▢" },
  { id: "gallery", label: "Gallery", icon: "▤" },
  { id: "video", label: "Video", icon: "▶" },
  { id: "quote", label: "Quote", icon: "❝" },
  { id: "statistics", label: "Statistics", icon: "Σ" },
  { id: "technologies", label: "Technologies", icon: "+" },
  { id: "twoColumn", label: "Two Columns", icon: "▯" },
  { id: "embed", label: "Embed", icon: "</>" },
  { id: "fullMedia", label: "Full-width Media", icon: "▦" },
] as const;

export type SectionType = (typeof SECTION_TYPES)[number]["id"];

export const TECH_CATEGORIES = ["Design", "Development", "Motion", "Tools"] as const;

export const DEFAULT_HOMEPAGE = {
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
    { label: "01 — ART DIRECTION", text: "Every interface starts with a concept, a voice and a composition, not a component library." },
    { label: "02 — ENGINEERING", text: "Design comes alive through clean code, fast rendering and deliberate motion." },
    { label: "03 — CRAFT", text: "Typography, pacing and detail are load-bearing — not decoration." },
  ],
  aboutPreviewTitle: "ABOUT",
  aboutPreviewText:
    "Taha Gmir is a creative developer, designer and visual storyteller working across web, interface and motion — building experiences that are meant to be remembered.",
  skillsTitle: "CAPABILITIES",
  skills: [
    {
      group: "DESIGN",
      items: ["Graphic Design", "UI/UX", "Visual Systems", "Branding", "Typography"],
    },
    {
      group: "DEVELOPMENT",
      items: ["Frontend", "Creative Development", "Interactive Experiences", "Design Systems"],
    },
    {
      group: "MOTION",
      items: ["Motion Design", "Video Editing", "After Effects", "Editorial Storytelling"],
    },
    {
      group: "TOOLS",
      items: ["Figma", "Photoshop", "Illustrator", "React", "Next.js", "TypeScript"],
    },
  ],
  contactHeadline: "LET'S BUILD SOMETHING WORTH EXPERIENCING.",
  contactSub:
    "If you have a product, brand or story that deserves a considered digital experience — let's talk.",
  finalHeadline: "THANKS FOR EXPERIENCING THE WORK.",
  finalAccent: "TAHA GMIR",
} as const;

export const DEFAULT_ABOUT = {
  name: "Taha Gmir",
  role: "Creative Developer & Designer",
  introLabel: "ABOUT",
  intro:
    "I build digital experiences at the intersection of design, engineering and storytelling. My work treats the interface as a medium — something to be composed, sequenced and felt, not just browsed.",
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
      degree: "Computer Science & Design",
      org: "[Your institution]",
      text: "",
    },
  ],
  servicesTitle: "SERVICES",
  services: [
    { title: "Web Design & Development", text: "Concept, design and code for performant, memorable websites." },
    { title: "Creative Development", text: "Interactive experiences, motion, WebGL and editorial interfaces." },
    { title: "Brand & Visual Identity", text: "Logos, typography, visual systems and campaign art direction." },
    { title: "Motion & Video", text: "Motion design, video editing and cinematic post-production." },
  ],
  profileNote: "Edit this page from the admin dashboard to shape this story.",
} as const;

export const DEFAULT_SETTINGS = {
  title: "Taha Gmir",
  tagline: "Creative Developer & Digital Experience Builder",
  description:
    "Taha Gmir is a creative developer, designer and visual storyteller building cinematic digital experiences.",
  contactEmail: "hello@tahagmir.com",
  footerText: "Designed & engineered by Taha Gmir.",
} as const;

export const DEFAULT_NAV = [
  { label: "WORK", href: "/work" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
] as const;

export const DEFAULT_SOCIALS = [
  { label: "GitHub", url: "https://github.com/", order: 0 },
  { label: "LinkedIn", url: "https://www.linkedin.com/", order: 1 },
  { label: "Instagram", url: "https://instagram.com/", order: 2 },
  { label: "Behance", url: "https://www.behance.net/", order: 3 },
] as const;

export const DEFAULT_AI = {
  name: "Taha AI",
  welcomeMessage:
    "Welcome to Taha's portfolio. Ask me about the projects, the design process or the technologies used — I can guide you to the right work.",
  suggestedQuestions: [
    "What projects did Taha build with Next.js?",
    "Which project best shows his design work?",
    "What technologies does he use?",
    "Can he design and develop a full website?",
    "Tell me about the case studies.",
  ],
} as const;
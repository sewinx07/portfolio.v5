import { db } from "@/lib/db";
import { parseJson } from "@/lib/validation";
import { getHomepage, getAbout, getPublishedProjects, getTechnologies } from "@/lib/content";

declare global {
  var __seededProjects: Array<{
    title: string;
    slug: string;
    category: string;
    shortDescription: string;
    technologies: string[];
  }>;
  var __seededTechs: string[];
}

export type AiMessage = { role: "user" | "assistant"; content: string };

export type AiReply = {
  reply: string;
  mode: "ai" | "local";
  suggestions?: string[];
};

async function suggestedQuestions(): Promise<string[]> {
  const ai = await db.aISettings.findUnique({ where: { id: "ai" } });
  return parseJson(ai?.suggestedQuestions ?? "[]", []);
}

export async function buildAiContext(): Promise<string> {
  const [ai, homepage, about, projects, techs] = await Promise.all([
    db.aISettings.findUnique({ where: { id: "ai" } }),
    getHomepage(),
    getAbout(),
    getPublishedProjects(),
    getTechnologies(),
  ]);

  const sections: string[] = [];
  sections.push(`WEBSITE OWNER: ${homepage.heroKicker || "Taha Gmir"}`);
  sections.push(`ROLE: ${about.role}`);
  sections.push(`TAGLINE: ${homepage.heroStatement}`);
  sections.push(`SHORT BIO: ${about.intro}`);
  sections.push(`FULL BIO:\n${about.bio}`);
  sections.push(`LOCATION: ${about.location} — AVAILABILITY: ${about.available}`);
  sections.push(
    `SERVICES: ${(about.services ?? [])
      .map((s: { title?: string }) => s?.title)
      .filter(Boolean)
      .join(" | ")}`
  );
  sections.push(
    `EXPERIENCE: ${(about.experience ?? [])
      .map(
        (e: { period?: string; role?: string; org?: string }) =>
          `${e?.period} — ${e?.role} @ ${e?.org}`
      )
      .join(" | ")}`
  );
  sections.push(
    `EDUCATION: ${(about.education ?? [])
      .map((e: { degree?: string; org?: string }) => `${e?.degree} @ ${e?.org}`)
      .join(" | ")}`
  );
  sections.push(
    `SKILLS: ${homepage.skills
      .map((s) => `${s.group}: ${s.items.join(", ")}`)
      .join(" | ")}`
  );
  sections.push(`TECHNOLOGY DIRECTORY: ${techs.map((t) => t.name).join(", ")}`);

  sections.push(
    `PROJECTS (${projects.length}):` +
      projects
        .map(
          (p) =>
            `\n- ${p.title} [slug: ${p.slug}] [category: ${p.category}] [year: ${p.year}] ${p.shortDescription} — tech: ${p.technologies
              .map((t) => t.technology.name)
              .join(", ")} — url: ${p.liveUrl || "(internal)"}`
        )
        .join("")
  );

  const custom = await db.aIKnowledge.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  });
  if (custom.length) {
    sections.push(
      "CUSTOM KNOWLEDGE:" +
        custom.map((k) => `\nQ: ${k.question}\nA: ${k.answer}`).join("")
    );
  }

  if (ai?.customPrompt) sections.push(`ADDITIONAL INSTRUCTIONS:\n${ai.customPrompt}`);
  return sections.join("\n\n");
}

const SYSTEM_TEMPLATE = `You are {A_NAME}, a portfolio curator and guide representing Taha Gmir's work. You help visitors discover the portfolio, understand the projects, and learn whether Taha is a good fit for their needs.

Ground every answer in the facts below. If the facts are insufficient, say so plainly and invite the visitor to contact Taha. You may recommend projects by answering with the project slug embedded as a marker like: {{project:slug}}. Do not invent projects, skills, clients, metrics, awards or testimonials. Keep answers concise, warm and editorial — 2 to 5 sentences unless a list is more useful. Address the visitor directly.

KNOWLEDGE:
{CONTEXT}`;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter((w) => w.length > 2);
}

function scoreProject(project: { title: string; slug: string; category: string; shortDescription: string; technologies: string[] }, queryTokens: string[]): number {
  const haystack = normalize(
    [project.title, project.category, project.shortDescription, project.technologies.join(" ")].join(" ")
  );
  return queryTokens.reduce((sum, t) => sum + (haystack.includes(t) ? 1 : 0), 0);
}

function fallbackAnswer(userText: string): string {
  const text = normalize(userText);
  const tokenz = tokenize(userText);
  const projects = (globalThis.__seededProjects ?? []) as {
    title: string; slug: string; category: string; shortDescription: string; technologies: string[];
  }[];

  const ranked = [...projects]
    .map((p) => ({ p, score: scoreProject(p, tokenz) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const hasHit = best && best.score > 0;

  if (/react/.test(text)) {
    return `Taha works with React daily — it's the foundation of most of his interactive work. The strongest example on the portfolio is his flagship project, "The Portfolio — A Cinematic CMS", which pairs React with Next.js and a CMS backend. {{project:cinematic-portfolio-cms}}`;
  }
  if (/next\.?js/.test(text) || /nextjs/.test(text)) {
    return `Great question. Taha's flagship project, "The Portfolio — A Cinematic CMS", is built entirely on Next.js — using it for server-rendered pages, the private admin dashboard and the API layer. {{project:cinematic-portfolio-cms}}`;
  }
  if (/design/.test(text) && /develop/.test(text)) {
    return `Yes — that's exactly the overlap in Taha's work. He conceives the visual direction and then engineers it himself. The best demonstration is "The Portfolio — A Cinematic CMS", where the art direction and the full-stack implementation come from the same hand. {{project:cinematic-portfolio-cms}}`;
  }
  if (/technology|stack|tech|tools|what do you use|what (does he|do you) use/.test(text)) {
    const techs = globalThis.__seededTechs ?? [];
    return `Taha's core toolset: ${techs.length ? techs.join(", ") : "React, Next.js, TypeScript, Prisma, Motion, CSS3"} — plus design tools like Figma and motion tools like After Effects. Want me to point you to a project that uses a specific one?`;
  }
  if (/contact|hire|get in touch|reach|email|work with/.test(text)) {
    return `The best way to reach Taha is through the contact page — there's a form at the link below, and you can also find his other channels there.`;
  }
  if (/can (he|you) (build|make|create|code|design)/.test(text)) {
    return `Yes. Taha's practice is deliberately full-spectrum: he designs the experience and then builds it with production-quality code. The site you're on right now is the cleanest proof — it's both a designed exhibit and an engineered product. {{project:cinematic-portfolio-cms}}`;
  }
  if (hasHit) {
    return `Based on your question, I'd start with "${best.p.title}" — ${best.p.shortDescription}. {{project:${best.p.slug}}}`;
  }
  return `I can help you explore Taha's projects, skills and process. Try asking things like "What has he built with React?" or "Which project best shows his design work?" or just describe what you're looking for.`;
}

// Fallback snapshot loaded at request time (avoids duplicate DB reads per message).
export async function loadFallbackSnapshot() {
  const [projects, techs] = await Promise.all([getPublishedProjects(), getTechnologies()]);
  globalThis.__seededProjects = projects.map((p) => ({
    title: p.title,
    slug: p.slug,
    category: p.category,
    shortDescription: p.shortDescription,
    technologies: p.technologies.map((t) => t.technology.name),
  }));
  globalThis.__seededTechs = techs.map((t) => t.name);
}

export async function generateAiReply(history: AiMessage[]): Promise<AiReply> {
  const settings = await db.aISettings.findUnique({ where: { id: "ai" } });
  const last = history[history.length - 1]?.content ?? "";
  const suggestions = await suggestedQuestions();

  if (!settings?.enabled) {
    return { reply: "", mode: "local", suggestions };
  }

  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return { reply: fallbackAnswer(last), mode: "local", suggestions };
  }

  const context = await buildAiContext();
  const system = SYSTEM_TEMPLATE.replace("{A_NAME}", settings?.name || "Taha AI").replace("{CONTEXT}", context);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: "system", content: system },
          ...history
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { reply: fallbackAnswer(last), mode: "local", suggestions };
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return { reply: fallbackAnswer(last), mode: "local", suggestions };
    return { reply, mode: "ai", suggestions };
  } catch {
    return { reply: fallbackAnswer(last), mode: "local", suggestions };
  }
}

export function extractProjectSlug(reply: string): string | null {
  const match = reply.match(/\{\{project:([\w-]+)\}\}/);
  return match ? match[1] : null;
}

export function stripProjectMarkers(reply: string): string {
  return reply.replace(/\{\{project:[\w-]+\}\}/g, "").trim();
}
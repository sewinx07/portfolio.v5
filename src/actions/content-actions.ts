"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { errState, okState } from "@/lib/utils";
import { vJson, vString, vBoolean, parseJson } from "@/lib/validation";
import { DEFAULT_SETTINGS, DEFAULT_HOMEPAGE, DEFAULT_ABOUT } from "@/lib/constants";

async function savePage(key: "homepage" | "about" | "contact", patch: Record<string, unknown>) {
  await requireAdmin();
  const existing = await db.pageContent.findUnique({ where: { key } });
  const defaults =
    key === "homepage" ? DEFAULT_HOMEPAGE : key === "about" ? DEFAULT_ABOUT : {};
  const merged = patch;
  const content = vJson(merged, defaults);
  if (existing) {
    await db.pageContent.update({ where: { key }, data: { content, title: vString(patch.title ?? key, 80) } });
  } else {
    await db.pageContent.create({ data: { key, title: String(key), content } });
  }
  revalidatePath("/", "layout");
  return okState(`${key} page saved.`);
}

export async function saveHomepageAction(patch: Record<string, unknown>) {
  return savePage("homepage", patch);
}

export async function saveAboutAction(patch: Record<string, unknown>) {
  return savePage("about", patch);
}

export async function saveContactPageAction(patch: Record<string, unknown>) {
  return savePage("contact", patch);
}

export type SiteSettingsPayload = {
  title?: string;
  tagline?: string;
  description?: string;
  contactEmail?: string;
  footerText?: string;
  analyticsEnabled?: boolean;
  maintenance?: boolean;
  faviconId?: string | null;
  logoId?: string | null;
  socialImageId?: string | null;
};

export async function saveSiteSettingsAction(patch: SiteSettingsPayload) {
  await requireAdmin();
  await db.siteSettings.upsert({
    where: { id: "site" },
    update: {
      title: vString(patch.title ?? "", 120),
      tagline: vString(patch.tagline ?? "", 200),
      description: vString(patch.description ?? "", 400),
      contactEmail: vString(patch.contactEmail ?? "", 120),
      footerText: vString(patch.footerText ?? "", 300),
      analyticsEnabled: vBoolean(patch.analyticsEnabled),
      maintenance: vBoolean(patch.maintenance),
      faviconId: patch.faviconId || null,
      logoId: patch.logoId || null,
      socialImageId: patch.socialImageId || null,
    },
    create: {
      id: "site",
      ...DEFAULT_SETTINGS,
      title: vString(patch.title ?? "", 120),
      tagline: vString(patch.tagline ?? "", 200),
      description: vString(patch.description ?? "", 400),
      contactEmail: vString(patch.contactEmail ?? "", 120),
      footerText: vString(patch.footerText ?? "", 300),
      analyticsEnabled: vBoolean(patch.analyticsEnabled),
      maintenance: vBoolean(patch.maintenance),
      faviconId: patch.faviconId || null,
      logoId: patch.logoId || null,
      socialImageId: patch.socialImageId || null,
    },
  });
  revalidatePath("/", "layout");
  return okState("Settings saved.");
}

export async function saveNavAction(items: Array<{ id?: string; label: string; href: string; visible: boolean }>) {
  await requireAdmin();
  const existing = await db.navItem.findMany({ orderBy: { order: "asc" } });
  const existingIds = existing.map((n) => n.id);
  const cleaned = items.map((n, i) => ({
    id: n.id && existingIds.includes(n.id) ? n.id : undefined,
    label: vString(n.label, 40, true),
    href: vString(n.href, 200, true),
    visible: Boolean(n.visible),
    order: i,
  }));

  await db.$transaction([
    ...cleaned.map((n) =>
      n.id
        ? db.navItem.update({ where: { id: n.id }, data: { label: n.label, href: n.href, visible: n.visible, order: n.order } })
        : db.navItem.create({ data: n })
    ),
  ]);
  const keepIds = cleaned.map((n) => n.id).filter((x): x is string => Boolean(x));
  const removedIds = existingIds.filter((id) => !keepIds.includes(id));
  if (removedIds.length) {
    await db.navItem.deleteMany({ where: { id: { in: removedIds } } });
  }
  revalidatePath("/", "layout");
  return okState("Navigation saved.");
}

export async function saveSocialsAction(socials: Array<{ id?: string; label: string; url: string; visible: boolean }>) {
  await requireAdmin();
  const existing = await db.socialLink.findMany({ orderBy: { order: "asc" } });
  const existingIds = existing.map((s) => s.id);
  const cleaned = socials.map((s, i) => ({
    id: s.id && existingIds.includes(s.id) ? s.id : undefined,
    label: vString(s.label, 60, true),
    url: vString(s.url, 300, true),
    visible: Boolean(s.visible),
    order: i,
  }));

  for (let i = 0; i < cleaned.length; i++) {
    const s = cleaned[i];
    if (s.id) {
      await db.socialLink.update({ where: { id: s.id }, data: { label: s.label, url: s.url, visible: s.visible, order: s.order } });
    } else {
      await db.socialLink.create({ data: s });
    }
  }
  const keepIds = cleaned.map((s) => s.id).filter((x): x is string => Boolean(x));
  const removedIds = existingIds.filter((id) => !keepIds.includes(id));
  if (removedIds.length) {
    await db.socialLink.deleteMany({ where: { id: { in: removedIds } } });
  }
  revalidatePath("/", "layout");
  return okState("Social links saved.");
}

export async function addKnowledgeAction(question: string, answer: string, kind = "FAQ") {
  await requireAdmin();
  const max = await db.aIKnowledge.aggregate({ _max: { order: true } });
  await db.aIKnowledge.create({
    data: {
      type: kind,
      question: vString(question, 200, true),
      answer: vString(answer, 4000, true),
      order: (max._max.order ?? -1) + 1,
      enabled: true,
    },
  });
  return okState("Knowledge added.");
}

export async function updateKnowledgeAction(id: string, patch: { question?: string; answer?: string; enabled?: boolean; type?: string }) {
  await requireAdmin();
  await db.aIKnowledge.update({
    where: { id },
    data: {
      question: patch.question !== undefined ? vString(patch.question, 200) : undefined,
      answer: patch.answer !== undefined ? vString(patch.answer, 4000) : undefined,
      enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : undefined,
      type: patch.type || undefined,
    },
  });
  return okState("Knowledge updated.");
}

export async function deleteKnowledgeAction(id: string) {
  await requireAdmin();
  await db.aIKnowledge.delete({ where: { id } });
  return okState("Knowledge removed.");
}

export type AISettingsPayload = {
  enabled?: boolean;
  name?: string;
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  useProjects?: boolean;
  useSkills?: boolean;
  useBio?: boolean;
  useExperience?: boolean;
  useServices?: boolean;
  customPrompt?: string;
};

export async function saveAISettingsAction(patch: AISettingsPayload) {
  await requireAdmin();
  const questions = Array.isArray(patch.suggestedQuestions)
    ? patch.suggestedQuestions.filter(Boolean).slice(0, 8)
    : [];
  await db.aISettings.upsert({
    where: { id: "ai" },
    update: {
      enabled: Boolean(patch.enabled),
      name: vString(patch.name ?? "", 60),
      welcomeMessage: vString(patch.welcomeMessage ?? "", 500),
      suggestedQuestions: JSON.stringify(questions),
      useProjects: Boolean(patch.useProjects),
      useSkills: Boolean(patch.useSkills),
      useBio: Boolean(patch.useBio),
      useExperience: Boolean(patch.useExperience),
      useServices: Boolean(patch.useServices),
      customPrompt: vString(patch.customPrompt ?? "", 3000),
    },
    create: {
      id: "ai",
      enabled: Boolean(patch.enabled),
      name: vString(patch.name ?? "", 60) || "Taha AI",
      welcomeMessage: vString(patch.welcomeMessage ?? "", 500),
      suggestedQuestions: JSON.stringify(questions),
      useProjects: Boolean(patch.useProjects),
      useSkills: Boolean(patch.useSkills),
      useBio: Boolean(patch.useBio),
      useExperience: Boolean(patch.useExperience),
      useServices: Boolean(patch.useServices),
      customPrompt: vString(patch.customPrompt ?? "", 3000),
    },
  });
  revalidatePath("/", "layout");
  return okState("AI settings saved.");
}
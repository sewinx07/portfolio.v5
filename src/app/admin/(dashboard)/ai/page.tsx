import type { Metadata } from "next";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/validation";
import { AiConfig } from "@/components/admin/AiConfig";

export const metadata: Metadata = {
  title: "AI Guide",
  robots: { index: false },
};

export default async function AdminAiPage() {
  const [settings, knowledge] = await Promise.all([
    db.aISettings.findUnique({ where: { id: "ai" } }),
    db.aIKnowledge.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AiConfig
      settings={{
        enabled: settings?.enabled ?? false,
        name: settings?.name ?? "Taha AI",
        welcomeMessage: settings?.welcomeMessage ?? "",
        suggestedQuestions: parseJson<string[]>(settings?.suggestedQuestions ?? "[]", []),
        useProjects: settings?.useProjects ?? true,
        useSkills: settings?.useSkills ?? true,
        useBio: settings?.useBio ?? true,
        useExperience: settings?.useExperience ?? true,
        useServices: settings?.useServices ?? true,
        customPrompt: settings?.customPrompt ?? "",
      }}
      knowledge={knowledge.map((k) => ({
        id: k.id,
        type: k.type,
        question: k.question,
        answer: k.answer,
        enabled: k.enabled,
      }))}
      aiMode={process.env.AI_API_KEY ? "server" : "local"}
    />
  );
}
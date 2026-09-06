import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { generateAiReply, loadFallbackSnapshot, extractProjectSlug, stripProjectMarkers, type AiMessage } from "@/lib/ai-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const h = await headers();
  const ip = getClientIp(h);
  const rl = rateLimit(`ai:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Slow down — you're asking too quickly." }, { status: 429 });
  }

  const settings = await db.aISettings.findUnique({ where: { id: "ai" } });
  if (!settings?.enabled) {
    return NextResponse.json({ reply: "", mode: "local", suggestions: [] });
  }

  let body: { messages?: AiMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter((m) => m?.role === "user" || m?.role === "assistant").slice(-12);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "No question provided." }, { status: 400 });
  }

  await loadFallbackSnapshot();
  const result = await generateAiReply(messages);

  const slug = extractProjectSlug(result.reply);
  return NextResponse.json({
    reply: stripProjectMarkers(result.reply),
    mode: result.mode,
    suggestions: result.suggestions ?? [],
    projectSlug: slug,
  });
}
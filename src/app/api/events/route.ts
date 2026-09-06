import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Lightweight first-party analytics. Disabled by site settings.
export async function POST(request: Request) {
  const h = await headers();
  const ip = getClientIp(h);
  const rl = rateLimit(`analytics:${ip}`, 120, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ ok: false }, { status: 429 });

  const settings = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (!settings?.analyticsEnabled) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  let body: { kind?: string; path?: string; slug?: string; referrer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const kind = body.kind === "PROJECT_VIEW" ? "PROJECT_VIEW" : "PAGE_VIEW";
  const path = String(body.path ?? "/").slice(0, 300);
  const slug = String(body.slug ?? "").slice(0, 200);
  const referrer = String(body.referrer ?? "").slice(0, 300);

  const ua = request.headers.get("user-agent") ?? "";
  let device = "unknown";
  if (/mobile/i.test(ua)) device = "mobile";
  else if (/tablet/i.test(ua)) device = "tablet";
  else if (/windows|macintosh|linux/i.test(ua)) device = "desktop";

  await db.analyticsEvent.create({ data: { kind, path, projectSlug: slug, referrer, device } });
  return NextResponse.json({ ok: true });
}
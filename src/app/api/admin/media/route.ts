import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession, getSessionOrDeny } from "@/lib/session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createMediaFromUpload } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSessionOrDeny();
    const h = await headers();
    const ip = getClientIp(h);
    const rl = rateLimit(`upload:${ip}`, 30, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Upload limit reached. Try again in a few minutes." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const media = await createMediaFromUpload(file);
    return NextResponse.json({ ok: true, media });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ error: message, detail: process.env.NODE_ENV === "development" ? String(e) : undefined }, { status: 400 });
  }
}

export async function GET() {
  const session = await getSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
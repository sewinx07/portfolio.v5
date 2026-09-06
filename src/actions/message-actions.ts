"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { errState, okState } from "@/lib/utils";
import { vString, assertValidEmail } from "@/lib/validation";
import { MESSAGE_STATUSES } from "@/lib/constants";

export async function submitContactAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const h = await headers();
  const ip = getClientIp(h);
  const rl = rateLimit(`contact:${ip}`, 3, 10 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, message: "You've sent a few messages already. Please wait a moment." };
  }

  const name = vString(formData.get("name"), 120, true);
  const email = vString(formData.get("email"), 120, true);
  const subject = vString(formData.get("subject"), 200);
  const message = vString(formData.get("message"), 8000, true);

  try {
    assertValidEmail(email);
    if (!name || !message) throw new Error("required");
    await db.contactSubmission.create({ data: { name, email, subject, message } });
  } catch {
    return { ok: false, message: "Please fill in your name, a valid email and a message." };
  }
  return { ok: true, message: "Message sent. I'll get back to you soon." };
}

export async function setMessageStatusAction(id: string, status: string) {
  await requireAdmin();
  if (!MESSAGE_STATUSES.includes(status as never)) return errState("Invalid status.");
  await db.contactSubmission.update({ where: { id }, data: { status: status as never } });
  return okState("Updated.");
}

export async function deleteMessageAction(id: string) {
  await requireAdmin();
  await db.contactSubmission.delete({ where: { id } });
  return okState("Message deleted.");
}
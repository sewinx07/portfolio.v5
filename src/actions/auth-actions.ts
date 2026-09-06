"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { failedLoginCount, getClientIp, rateLimit, recordLoginAttempt } from "@/lib/rate-limit";
import { errState, okState, type ActionState } from "@/lib/utils";

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const h = await headers();
  const ip = getClientIp(h);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Rate limiting: 5 attempts / 10 min window per IP.
  const rl = rateLimit(`login:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return errState("Too many attempts. Try again in a few minutes.");
  }
  const recentFails = await failedLoginCount(ip, 15);
  if (recentFails >= 8) {
    return errState("Account temporarily locked. Try again later.");
  }

  if (!email || !password) {
    return errState("Email and password are required.");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await recordLoginAttempt(ip, false);
    return errState("Invalid credentials.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  await recordLoginAttempt(ip, valid);
  if (!valid) {
    return errState("Invalid credentials.");
  }
  if (user.role === "VIEWER") {
    return errState("This account does not have access.");
  }

  const token = await createSession(user);
  await setSessionCookie(token);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
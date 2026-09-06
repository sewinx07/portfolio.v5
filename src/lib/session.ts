import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "taha_session";

export type SessionUser = {
  sub: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must be set to at least 24 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: User): Promise<string> {
  const secret = getSecret();
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: (payload.email as string) ?? "",
      name: (payload.name as string) ?? "",
      role: (payload.role as SessionUser["role"]) ?? "VIEWER",
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Server-side session retrieval used by server components, actions and routes. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Guard for admin mutations — always verify against the DB, not just the cookie. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role === "VIEWER") {
    throw new Error("UNAUTHORIZED");
  }
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user) throw new Error("UNAUTHORIZED");
  return session;
}

/** Hard guard used by API route handlers. */
export async function getSessionOrDeny(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role === "VIEWER") {
    const err = new Error("UNAUTHORIZED") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return session;
}
export function vString(value: unknown, max = 20000, required = false): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (required && !v) throw new Error("required-field");
  return v.slice(0, max);
}

export function vOptionalString(value: unknown, max = 20000): string {
  return vString(value, max, false);
}

export function vNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function vBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1;
}

export function vJson(value: unknown, fallback: unknown): string {
  try {
    if (typeof value === "string") {
      JSON.parse(value);
      return value;
    }
    return JSON.stringify(value ?? fallback);
  } catch {
    return JSON.stringify(fallback ?? {});
  }
}

export function parseJson<T = unknown>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export function assertValidEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error("invalid-email");
  }
}
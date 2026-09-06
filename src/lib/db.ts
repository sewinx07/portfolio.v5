import { PrismaClient } from "@prisma/client";

function makeClient() {
  return new PrismaClient({
    // MediaItem.data holds up to 30MB of raw bytes — never ship it to pages by
    // default. It is only returned when a query explicitly selects it (e.g. the
    // /media/[id] serve route).
    omit: { mediaItem: { data: true } },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

type PrismaDb = ReturnType<typeof makeClient>;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaDb };

export const db = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
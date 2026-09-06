import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";

try {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  if (typeof process.loadEnvFile === "function") process.loadEnvFile(envPath);
} catch {}

const prisma = new PrismaClient();
const log = (msg) => console.log(`[backfill] ${msg}`);

// Deterministic copy of poster() in prisma/seed.mjs — only touches the four
// seed media rows: fills MediaItem.data and switches url to /media/<id> so the
// DB-backed serve route works on Vercel (filesystem is read-only there).
function poster(name, title, index, accent = "#111111", bg = "#F4F2EE") {
  const variants = [
    `M0,0 L${720 * 0.35},0 L0,${720 * 0.35} Z`,
    `M720,0 L720,${720 * 0.4} L${720 * 0.6},0 Z`,
    `M0,720 L${720 * 0.42},720 L0,${720 * 0.58} Z`,
    `M720,720 L${720 * 0.58},720 L720,${720 * 0.42} Z`,
  ];
  const clip = variants[index % variants.length];
  const label = `TAHA GMIR — ${String(index + 1).padStart(2, "0")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <rect width="1440" height="900" fill="${bg}"/>
  <clipPath id="c"><path d="${clip}"/></clipPath>
  <g clip-path="url(#c)"><rect width="1440" height="900" fill="${accent}"/></g>
  <rect x="64" y="64" width="1312" height="772" fill="none" stroke="#111111" stroke-opacity="0.15"/>
  <text x="72" y="120" font-family="ui-monospace, monospace" font-size="22" letter-spacing="6" fill="#111111" fill-opacity="0.5">${label}</text>
  <g transform="translate(72 620)">
    <line x1="0" y1="0" x2="180" y2="0" stroke="#111111" stroke-width="2"/>
    <text y="34" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="72" letter-spacing="-2" fill="#111111">${title}</text>
    <text y="78" font-family="ui-monospace, monospace" font-size="24" letter-spacing="8" fill="#111111" fill-opacity="0.65">NEW WORK — ${String(index + 1).padStart(2, "0")}</text>
  </g>
</svg>`;
}

function mediaSpec(id, filename, title, index, accent) {
  const svg = poster(filename, title, index, accent);
  return { id, filename, svg, size: Buffer.byteLength(svg) };
}

const specs = [
  mediaSpec("portfolio-poster-main-media", "portfolio-poster-main.svg", "A CINEMATIC CMS", 0, "#101012"),
  mediaSpec("portfolio-poster-detail-media", "portfolio-poster-detail.svg", "EXPERIENCE ENGINE", 1, "#3C2F27"),
  mediaSpec("film-poster-media", "film-poster.svg", "VISUAL ESSAYS", 2, "#4A1F1F"),
  mediaSpec("brand-poster-media", "brand-poster.svg", "SYSTEMS & IDENTITY", 3, "#16324A"),
];

let updated = 0;
for (const s of specs) {
  const row = await prisma.mediaItem.findUnique({ where: { id: s.id } });
  if (!row) {
    log(`skip ${s.id} — row missing`);
    continue;
  }
  if (row.data && row.url === `/media/${s.id}`) {
    log(`skip ${s.id} — already backfilled`);
    continue;
  }
  await prisma.mediaItem.update({
    where: { id: s.id },
    data: { url: `/media/${s.id}`, size: s.size, data: Buffer.from(s.svg, "utf8") },
  });
  updated++;
  log(`updated ${s.id} → /media/${s.id} (${s.size} bytes)`);
}

// Safety net: any other row still pointing into /uploads/ (legacy disk media)
// has no recoverable bytes and can never load on Vercel.
const orphans = await prisma.mediaItem.findMany({
  where: { url: { startsWith: "/uploads/" } },
  select: { id: true, filename: true, url: true },
});
for (const o of orphans) {
  log(`legacy row ${o.id} (${o.filename}) → ${o.url} — no bytes recoverable`);
}

log(`done (${updated} updated, ${orphans.length} legacy rows)`);
await prisma.$disconnect();
import type { Metadata, Viewport } from "next";
import { Archivo, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/constants";

const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  let settings = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (!settings) {
    settings = {
      id: "site",
      title: DEFAULT_SETTINGS.title,
      tagline: DEFAULT_SETTINGS.tagline,
      description: DEFAULT_SETTINGS.description,
      contactEmail: DEFAULT_SETTINGS.contactEmail,
      footerText: DEFAULT_SETTINGS.footerText,
      analyticsEnabled: false,
      maintenance: false,
      faviconId: null,
      logoId: null,
      socialImageId: null,
      updatedAt: new Date(),
    };
  }
  const description =
    settings?.description ||
    DEFAULT_SETTINGS.description ||
    "Taha Gmir is a creative developer, designer and visual storyteller.";
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${settings?.title ?? "Taha Gmir"} — ${settings?.tagline ?? "Creative Developer"}`,
      template: `%s — ${settings?.title ?? "Taha Gmir"}`,
    },
    description,
    applicationName: settings?.title ?? "Taha Gmir",
    openGraph: {
      title: `${settings?.title ?? "Taha Gmir"} — Portfolio`,
      description,
      url: siteUrl,
      siteName: settings?.title ?? "Taha Gmir",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings?.title ?? "Taha Gmir"} — Portfolio`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F2EE",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${spaceMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
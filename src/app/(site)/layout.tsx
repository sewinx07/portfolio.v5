import { getSite, getNav, getSocials } from "@/lib/content";
import { parseJson } from "@/lib/validation";
import { TransitionProvider } from "@/components/public/TransitionProvider";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { BootOverlay } from "@/components/public/BootOverlay";
import { Cursor } from "@/components/public/Cursor";
import { AIAssistant } from "@/components/public/AIAssistant";
import { MaintenanceScreen } from "@/components/public/MaintenanceScreen";
import { db } from "@/lib/db";
import { DEFAULT_AI } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, nav, socials, aiSettings] = await Promise.all([
    getSite(),
    getNav(),
    getSocials(),
    db.aISettings.findUnique({ where: { id: "ai" } }),
  ]);

  const brand = site?.title || "Taha Gmir";

  if (site?.maintenance) {
    return (
      <div className="grain">
        <MaintenanceScreen brand={brand} />
      </div>
    );
  }

  const ai = {
    enabled: aiSettings?.enabled ?? false,
    name: aiSettings?.name || DEFAULT_AI.name,
    welcome: aiSettings?.welcomeMessage || DEFAULT_AI.welcomeMessage,
    suggestions: parseJson(aiSettings?.suggestedQuestions ?? "[]", DEFAULT_AI.suggestedQuestions as never),
  };

  return (
    <div className="grain">
      <BootOverlay brand={brand} />
      <TransitionProvider>
        <SiteHeader brand={brand} nav={nav} />
        <main>{children}</main>
        <SiteFooter
          brand={brand}
          footerText={site?.footerText || "Designed & engineered by Taha Gmir."}
          socials={socials}
          year={new Date().getFullYear().toString()}
        />
        <Cursor />
        <AIAssistant enabled={ai.enabled} name={ai.name} welcome={ai.welcome} suggestions={ai.suggestions} />
      </TransitionProvider>
    </div>
  );
}
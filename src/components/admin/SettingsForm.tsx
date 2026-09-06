"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSiteSettingsAction } from "@/actions/content-actions";
import { notify } from "@/components/admin/toast";
import { Field, Input, Textarea, CheckRow, SubmitBtn, Card } from "@/components/admin/ui";

export function SettingsForm({
  settings,
  user,
}: {
  settings: {
    title: string;
    tagline: string;
    description: string;
    contactEmail: string;
    footerText: string;
    analyticsEnabled: boolean;
    maintenance: boolean;
  } | null;
  user: { email: string; name: string } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: settings?.title ?? "",
    tagline: settings?.tagline ?? "",
    description: settings?.description ?? "",
    contactEmail: settings?.contactEmail ?? "",
    footerText: settings?.footerText ?? "",
    analyticsEnabled: settings?.analyticsEnabled ?? false,
    maintenance: settings?.maintenance ?? false,
  });

  async function save() {
    setBusy(true);
    const res = await saveSiteSettingsAction(form);
    setBusy(false);
    notify(res.message, res.ok);
    router.refresh();
  }

  return (
    <div className="stack">
      <Card title="SITE">
        <div className="grid-2">
          <Field label="TITLE"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="TAGLINE"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
        </div>
        <Field label="DESCRIPTION" hint="Used in SEO meta and Open Graph.">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="CONTACT EMAIL">
          <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </Field>
        <Field label="FOOTER TEXT">
          <Input value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
        </Field>
        <CheckRow
          label="Enable first-party analytics"
          hint="Anonymized page & project view counts."
          checked={form.analyticsEnabled}
          onChange={(v) => setForm({ ...form, analyticsEnabled: v })}
        />
        <CheckRow
          label="Maintenance mode"
          hint="Shows a 'coming soon' screen to all public visitors. The CMS stays reachable at /admin."
          checked={form.maintenance}
          onChange={(v) => setForm({ ...form, maintenance: v })}
        />
      </Card>

      <Card title="ACCOUNT">
        {user ? (
          <div className="grid-2">
            <Field label="EMAIL"><Input defaultValue={user.email} disabled /></Field>
            <Field label="NAME"><Input defaultValue={user.name} disabled /></Field>
          </div>
        ) : (
          <p className="note">An admin account is created automatically on first run. See the README for credentials.</p>
        )}
        <p className="note">
          Password changes are managed via the Prisma CLI or by editing the seed — a change-password tool is on the roadmap.
        </p>
      </Card>

      <Card title="SAVE">
        <SubmitBtn pending={busy ? "SAVING…" : undefined} onClick={() => save().catch(() => {})}>
          SAVE SETTINGS
        </SubmitBtn>
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveNavAction, saveSocialsAction } from "@/actions/content-actions";
import { notify } from "@/components/admin/toast";
import { CheckRow, SubmitBtn, Card, ActionBtn } from "@/components/admin/ui";

type Item = { id?: string; label: string; href: string; visible: boolean };

export function NavEditor({
  nav,
  socials,
}: {
  nav: Array<{ id: string; label: string; href: string; visible: boolean }>;
  socials: Array<{ id: string; label: string; url: string; visible: boolean }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [navItems, setNavItems] = useState<Item[]>(nav);
  const [socialItems, setSocialItems] = useState<Item[]>(socials.map((s) => ({ id: s.id, label: s.label, href: s.url, visible: s.visible })));

  async function saveNav() {
    setBusy(true);
    const res = await saveNavAction(navItems);
    setBusy(false);
    notify(res.message, res.ok);
    router.refresh();
  }

  async function saveSocials() {
    setBusy(true);
    const res = await saveSocialsAction(
      socialItems.map((s) => ({ id: s.id, label: s.label, url: s.href, visible: s.visible }))
    );
    setBusy(false);
    notify(res.message, res.ok);
    router.refresh();
  }

  function rows(
    items: Item[],
    set: (v: Item[]) => void,
    key: "label" | "href",
    placeholderHref: string
  ) {
    return items.map((item, i) => (
      <div className="nav-row" key={i}>
        <input
          className="input"
          value={item.label}
          placeholder="Label"
          onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
        />
        <input
          className="input"
          value={item[key]}
          placeholder={placeholderHref}
          onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, [key]: e.target.value } : x)))}
        />
        <CheckRow
          label=""
          checked={item.visible}
          onChange={(v) => set(items.map((x, j) => (j === i ? { ...x, visible: v } : x)))}
        />
        <ActionBtn variant="danger" className="btn-sm" onClick={() => set(items.filter((_, j) => j !== i))}>✕</ActionBtn>
      </div>
    ));
  }

  return (
    <div className="stack">
      <Card title="NAVIGATION">
        {rows(navItems, setNavItems, "href", "/work")}
        <div className="nav-ops">
          <ActionBtn className="btn-sm" onClick={() => setNavItems([...navItems, { label: "", href: "", visible: true }])}>
            + ADD ITEM
          </ActionBtn>
          <SubmitBtn pending={busy ? "SAVING…" : undefined} onClick={() => saveNav().catch(() => {})}>
            SAVE NAV
          </SubmitBtn>
        </div>
      </Card>

      <Card title="SOCIAL LINKS">
        {rows(socialItems, setSocialItems, "href", "https://…")}
        <div className="nav-ops">
          <ActionBtn className="btn-sm" onClick={() => setSocialItems([...socialItems, { label: "", href: "", visible: true }])}>
            + ADD LINK
          </ActionBtn>
          <SubmitBtn pending={busy ? "SAVING…" : undefined} onClick={() => saveSocials().catch(() => {})}>
            SAVE SOCIALS
          </SubmitBtn>
        </div>
      </Card>
    </div>
  );
}
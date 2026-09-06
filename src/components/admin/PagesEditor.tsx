"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveHomepageAction, saveAboutAction, saveContactPageAction } from "@/actions/content-actions";
import { notify } from "@/components/admin/toast";
import { Field, Input, Textarea, Select, SubmitBtn, Card, ActionBtn } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export type HomepageShape = {
  heroKicker: string;
  heroLabel: string;
  heroHeadline: string;
  heroRoles: string[];
  heroStatement: string;
  heroCtaLabel: string;
  storyTitle: string;
  storyParagraph: string;
  storyPoints: Array<{ label: string; text: string }>;
  aboutPreviewTitle: string;
  aboutPreviewText: string;
  skillsTitle: string;
  skills: Array<{ group: string; items: string[] }>;
  contactHeadline: string;
  contactSub: string;
  finalHeadline: string;
  finalAccent: string;
};

export type AboutShape = {
  name: string;
  role: string;
  introLabel: string;
  intro: string;
  pullQuote: string;
  bioTitle: string;
  bio: string;
  infoTitle: string;
  location: string;
  available: string;
  languages: string;
  experienceTitle: string;
  experience: Array<{ period: string; role: string; org: string; text: string }>;
  educationTitle: string;
  education: Array<{ period: string; degree: string; org: string; text: string }>;
  servicesTitle: string;
  services: Array<{ title: string; text: string }>;
  profileNote: string;
};

const TABS = ["HOMEPAGE", "ABOUT", "CONTACT"] as const;

export function PagesEditor({
  homepage,
  about,
  contact,
}: {
  homepage: HomepageShape;
  about: AboutShape;
  contact: { headline: string; sub: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("HOMEPAGE");
  const [h, setH] = useState<HomepageShape>(homepage);
  const [a, setA] = useState<AboutShape>(about);
  const [c, setC] = useState(contact);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    let res;
    if (tab === "HOMEPAGE") res = await saveHomepageAction(h as unknown as Record<string, unknown>);
    if (tab === "ABOUT") res = await saveAboutAction(a as unknown as Record<string, unknown>);
    if (tab === "CONTACT") res = await saveContactPageAction(c as unknown as Record<string, unknown>);
    setBusy(false);
    if (res) notify(res.message, res.ok);
    router.refresh();
  }

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={cn("tab", tab === t && "active")} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
        <div className="tabs-actions">
          <SubmitBtn pending={busy ? "SAVING…" : undefined} onClick={() => save().catch(() => {})}>
            SAVE {tab}
          </SubmitBtn>
        </div>
      </div>

      {tab === "HOMEPAGE" && <HomepageForm value={h} onChange={setH} />}
      {tab === "ABOUT" && <AboutForm value={a} onChange={setA} />}
      {tab === "CONTACT" && (
        <Card title="CONTACT PAGE">
          <div className="stack">
            <Field label="HEADLINE">
              <Textarea rows={2} value={c.headline} onChange={(e) => setC({ ...c, headline: e.target.value })} />
            </Field>
            <Field label="SUBHEADING">
              <Input value={c.sub} onChange={(e) => setC({ ...c, sub: e.target.value })} />
            </Field>
          </div>
        </Card>
      )}
    </>
  );
}

function HomepageForm({ value, onChange }: { value: HomepageShape; onChange: (v: HomepageShape) => void }) {
  const set = <K extends keyof HomepageShape>(k: K, v: HomepageShape[K]) => onChange({ ...value, [k]: v });
  const setPoint = (i: number, p: Partial<HomepageShape["storyPoints"][number]>) =>
    set("storyPoints", value.storyPoints.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const setSkill = (i: number, s: Partial<HomepageShape["skills"][number]>) =>
    set("skills", value.skills.map((x, j) => (j === i ? { ...x, ...s } : x)));

  return (
    <div className="stack">
      <Card title="HERO">
        <div className="grid-2">
          <Field label="KICKER"><Input value={value.heroKicker} onChange={(e) => set("heroKicker", e.target.value)} /></Field>
          <Field label="LABEL"><Input value={value.heroLabel} onChange={(e) => set("heroLabel", e.target.value)} /></Field>
        </div>
        <Field label="HEADLINE">
          <Input value={value.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
        </Field>
        <Field label="ROLES" hint="One per line — rotates in the hero.">
          <Textarea rows={4} value={value.heroRoles.join("\n")} onChange={(e) => set("heroRoles", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} />
        </Field>
        <div className="grid-2">
          <Field label="STATEMENT"><Input value={value.heroStatement} onChange={(e) => set("heroStatement", e.target.value)} /></Field>
          <Field label="CTA LABEL"><Input value={value.heroCtaLabel} onChange={(e) => set("heroCtaLabel", e.target.value)} /></Field>
        </div>
      </Card>

      <Card title="STORY">
        <Field label="TITLE"><Input value={value.storyTitle} onChange={(e) => set("storyTitle", e.target.value)} /></Field>
        <Field label="PARAGRAPH"><Textarea rows={3} value={value.storyParagraph} onChange={(e) => set("storyParagraph", e.target.value)} /></Field>
        <span className="flabel">POINTS</span>
        {value.storyPoints.map((p, i) => (
          <div className="pair" key={i}>
            <Input value={p.label} placeholder="Label (01 — …)" onChange={(e) => setPoint(i, { label: e.target.value })} />
            <Input value={p.text} placeholder="Text" onChange={(e) => setPoint(i, { text: e.target.value })} />
          </div>
        ))}
      </Card>

      <Card title="ABOUT PREVIEW">
        <div className="grid-2">
          <Field label="TITLE"><Input value={value.aboutPreviewTitle} onChange={(e) => set("aboutPreviewTitle", e.target.value)} /></Field>
        </div>
        <Field label="TEXT"><Textarea rows={4} value={value.aboutPreviewText} onChange={(e) => set("aboutPreviewText", e.target.value)} /></Field>
      </Card>

      <Card title="SKILLS">
        <Field label="SECTIONS TITLE"><Input value={value.skillsTitle} onChange={(e) => set("skillsTitle", e.target.value)} /></Field>
        <span className="flabel">GROUPS</span>
        {value.skills.map((s, i) => (
          <div className="pair pair-stack" key={i}>
            <div className="pair">
              <Input value={s.group} placeholder="Group name" onChange={(e) => setSkill(i, { group: e.target.value })} />
              <ActionBtn variant="danger" className="btn-sm" onClick={() => set("skills", value.skills.filter((_, j) => j !== i))}>✕</ActionBtn>
            </div>
            <Textarea rows={2} value={s.items.join(", ")} placeholder="Items, comma separated" onChange={(e) => setSkill(i, { items: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
          </div>
        ))}
        <ActionBtn className="btn-sm" onClick={() => set("skills", [...value.skills, { group: "", items: [] }])}>+ ADD GROUP</ActionBtn>
      </Card>

      <Card title="CONTACT CTA + FINAL">
        <Field label="CONTACT HEADLINE"><Textarea rows={2} value={value.contactHeadline} onChange={(e) => set("contactHeadline", e.target.value)} /></Field>
        <Field label="CONTACT SUB"><Textarea rows={2} value={value.contactSub} onChange={(e) => set("contactSub", e.target.value)} /></Field>
        <div className="grid-2">
          <Field label="FINAL HEADLINE"><Textarea rows={2} value={value.finalHeadline} onChange={(e) => set("finalHeadline", e.target.value)} /></Field>
          <Field label="FINAL ACCENT"><Input value={value.finalAccent} onChange={(e) => set("finalAccent", e.target.value)} /></Field>
        </div>
      </Card>
    </div>
  );
}

function AboutForm({ value, onChange }: { value: AboutShape; onChange: (v: AboutShape) => void }) {
  const set = <K extends keyof AboutShape>(k: K, v: AboutShape[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="stack">
      <Card title="IDENTITY">
        <div className="grid-2">
          <Field label="FULL NAME"><Input value={value.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="ROLE"><Input value={value.role} onChange={(e) => set("role", e.target.value)} /></Field>
        </div>
        <Field label="INTRO LABEL"><Input value={value.introLabel} onChange={(e) => set("introLabel", e.target.value)} /></Field>
        <Field label="INTRO"><Textarea rows={3} value={value.intro} onChange={(e) => set("intro", e.target.value)} /></Field>
      </Card>

      <Card title="BIO">
        <Field label="PULL QUOTE"><Textarea rows={2} value={value.pullQuote} onChange={(e) => set("pullQuote", e.target.value)} /></Field>
        <Field label="BIO TITLE"><Input value={value.bioTitle} onChange={(e) => set("bioTitle", e.target.value)} /></Field>
        <Field label="BIO" hint="Separate paragraphs with a blank line.">
          <Textarea rows={8} value={value.bio} onChange={(e) => set("bio", e.target.value)} />
        </Field>
      </Card>

      <Card title="INFO">
        <Field label="INFO TITLE"><Input value={value.infoTitle} onChange={(e) => set("infoTitle", e.target.value)} /></Field>
        <div className="grid-3">
          <Field label="LOCATION"><Input value={value.location} onChange={(e) => set("location", e.target.value)} /></Field>
          <Field label="AVAILABILITY"><Input value={value.available} onChange={(e) => set("available", e.target.value)} /></Field>
          <Field label="LANGUAGES"><Input value={value.languages} onChange={(e) => set("languages", e.target.value)} /></Field>
        </div>
      </Card>

      <Card title="EXPERIENCE & EDUCATION">
        <Field label="EXPERIENCE TITLE"><Input value={value.experienceTitle} onChange={(e) => set("experienceTitle", e.target.value)} /></Field>
        <span className="flabel">ROLES</span>
        {value.experience.map((x, i) => (
          <div className="pair-stack" key={i}>
            <div className="grid-3">
              <Input value={x.period} placeholder="Period" onChange={(e) => set("experience", value.experience.map((y, j) => j === i ? { ...y, period: e.target.value } : y))} />
              <Input value={x.role} placeholder="Role" onChange={(e) => set("experience", value.experience.map((y, j) => j === i ? { ...y, role: e.target.value } : y))} />
              <Input value={x.org} placeholder="Organization" onChange={(e) => set("experience", value.experience.map((y, j) => j === i ? { ...y, org: e.target.value } : y))} />
            </div>
            <div className="pair">
              <Textarea rows={2} value={x.text} placeholder="Description" onChange={(e) => set("experience", value.experience.map((y, j) => j === i ? { ...y, text: e.target.value } : y))} />
              <ActionBtn variant="danger" className="btn-sm" onClick={() => set("experience", value.experience.filter((_, j) => j !== i))}>✕</ActionBtn>
            </div>
          </div>
        ))}
        <ActionBtn className="btn-sm" onClick={() => set("experience", [...value.experience, { period: "", role: "", org: "", text: "" }])}>+ ADD ROLE</ActionBtn>

        <div className="hairline-v" />
        <Field label="EDUCATION TITLE"><Input value={value.educationTitle} onChange={(e) => set("educationTitle", e.target.value)} /></Field>
        {value.education.map((x, i) => (
          <div className="pair-stack" key={i}>
            <div className="grid-3">
              <Input value={x.period} placeholder="Period" onChange={(e) => set("education", value.education.map((y, j) => j === i ? { ...y, period: e.target.value } : y))} />
              <Input value={x.degree} placeholder="Degree" onChange={(e) => set("education", value.education.map((y, j) => j === i ? { ...y, degree: e.target.value } : y))} />
              <Input value={x.org} placeholder="Institution" onChange={(e) => set("education", value.education.map((y, j) => j === i ? { ...y, org: e.target.value } : y))} />
            </div>
            <Textarea rows={1} value={x.text} placeholder="Description" onChange={(e) => set("education", value.education.map((y, j) => j === i ? { ...y, text: e.target.value } : y))} />
          </div>
        ))}
        <ActionBtn className="btn-sm" onClick={() => set("education", [...value.education, { period: "", degree: "", org: "", text: "" }])}>+ ADD EDUCATION</ActionBtn>
      </Card>

      <Card title="SERVICES">
        <Field label="SERVICES TITLE"><Input value={value.servicesTitle} onChange={(e) => set("servicesTitle", e.target.value)} /></Field>
        {value.services.map((s, i) => (
          <div className="pair-stack" key={i}>
            <div className="pair">
              <Input value={s.title} placeholder="Service name" onChange={(e) => set("services", value.services.map((y, j) => j === i ? { ...y, title: e.target.value } : y))} />
              <ActionBtn variant="danger" className="btn-sm" onClick={() => set("services", value.services.filter((_, j) => j !== i))}>✕</ActionBtn>
            </div>
            <Textarea rows={2} value={s.text} placeholder="Description" onChange={(e) => set("services", value.services.map((y, j) => j === i ? { ...y, text: e.target.value } : y))} />
          </div>
        ))}
        <ActionBtn className="btn-sm" onClick={() => set("services", [...value.services, { title: "", text: "" }])}>+ ADD SERVICE</ActionBtn>
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAISettingsAction, addKnowledgeAction, updateKnowledgeAction, deleteKnowledgeAction } from "@/actions/content-actions";
import { notify } from "@/components/admin/toast";
import { Field, Input, Textarea, CheckRow, SubmitBtn, Card, ActionBtn } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Knowledge = { id: string; type: string; question: string; answer: string; enabled: boolean };

export function AiConfig({
  settings,
  knowledge,
  aiMode,
}: {
  settings: {
    enabled: boolean;
    name: string;
    welcomeMessage: string;
    suggestedQuestions: string[];
    useProjects: boolean;
    useSkills: boolean;
    useBio: boolean;
    useExperience: boolean;
    useServices: boolean;
    customPrompt: string;
  };
  knowledge: Knowledge[];
  aiMode: "server" | "local";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(settings);
  const [questions, setQuestions] = useState<string[]>(settings.suggestedQuestions);
  const [newQ, setNewQ] = useState({ question: "", answer: "", type: "FAQ" });

  async function save() {
    setBusy(true);
    const res = await saveAISettingsAction({ ...form, suggestedQuestions: questions });
    setBusy(false);
    notify(res.message, res.ok);
    router.refresh();
  }

  async function addK() {
    if (!newQ.question.trim() || !newQ.answer.trim()) {
      notify("Question and answer are required.", false);
      return;
    }
    setBusy(true);
    const res = await addKnowledgeAction(newQ.question, newQ.answer, newQ.type);
    setBusy(false);
    notify(res.message, res.ok);
    setNewQ({ question: "", answer: "", type: "FAQ" });
    router.refresh();
  }

  async function toggleK(k: Knowledge) {
    const res = await updateKnowledgeAction(k.id, { enabled: !k.enabled });
    notify(res.message, res.ok);
    router.refresh();
  }

  async function removeK(k: Knowledge) {
    if (!confirm(`Delete knowledge: "${k.question}"?`)) return;
    const res = await deleteKnowledgeAction(k.id);
    notify(res.message, res.ok);
    router.refresh();
  }

  return (
    <div className="stack">
      <Card title="AI GUIDE">
        <div className="ai-mode">
          Mode: <span className={cn("badge", aiMode === "server" ? "badge-green" : "badge-gray")}>{aiMode === "server" ? "CONNECTED (API KEY SET)" : "LOCAL FALLBACK ENGINE"}</span>
          <p className="note">
            {aiMode === "local"
              ? "No AI_API_KEY in .env — the guide answers from a local keyword engine using your site content. Add the key to upgrade to a model."
              : "The guide uses your AI_API_KEY model, grounded in site content."}
          </p>
        </div>

        <div className="grid-2">
          <Field label="GUIDE NAME"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <span className="check-wrap">
            <CheckRow label="Enable the assistant on the site" checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} />
          </span>
        </div>
        <Field label="WELCOME MESSAGE">
          <Textarea rows={2} value={form.welcomeMessage} onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })} />
        </Field>

        <span className="flabel">SUGGESTED QUESTIONS</span>
        {questions.map((q, i) => (
          <div className="pair" key={i}>
            <Input value={q} onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? e.target.value : x)))} />
            <ActionBtn variant="danger" className="btn-sm" onClick={() => setQuestions(questions.filter((_, j) => j !== i))}>✕</ActionBtn>
          </div>
        ))}
        <Input
          className="q-add"
          placeholder="Add a suggested question…"
          value={newQ.question}
          onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newQ.question.trim()) {
              e.preventDefault();
              setQuestions([...(questions.filter(Boolean)), newQ.question.trim()]);
              setNewQ((q) => ({ ...q, question: "" }));
            }
          }}
        />

        <span className="flabel">GROUNDING SOURCES</span>
        <div className="grid-2">
          <CheckRow label="Projects" checked={form.useProjects} onChange={(v) => setForm({ ...form, useProjects: v })} />
          <CheckRow label="Skills" checked={form.useSkills} onChange={(v) => setForm({ ...form, useSkills: v })} />
          <CheckRow label="Bio" checked={form.useBio} onChange={(v) => setForm({ ...form, useBio: v })} />
          <CheckRow label="Experience" checked={form.useExperience} onChange={(v) => setForm({ ...form, useExperience: v })} />
          <CheckRow label="Services" checked={form.useServices} onChange={(v) => setForm({ ...form, useServices: v })} />
        </div>

        <Field label="CUSTOM PROMPT" hint="Extra instructions the guide must follow.">
          <Textarea rows={4} value={form.customPrompt} onChange={(e) => setForm({ ...form, customPrompt: e.target.value })} />
        </Field>

        <SubmitBtn pending={busy ? "SAVING…" : undefined} onClick={() => save().catch(() => {})}>
          SAVE AI SETTINGS
        </SubmitBtn>
      </Card>

      <Card title="KNOWLEDGE BASE" actions={<span className="card-badge">{knowledge.length} entries</span>}>
        <div className="k-list">
          {knowledge.map((k) => (
            <div className="k-row" key={k.id}>
              <div className="k-body">
                <span className={cn("badge", k.type === "CUSTOM" ? "badge-green" : "badge-gray")}>{k.type}</span>
                <span className="td-strong">{k.question}</span>
                <span className={cn("td-sub", !k.enabled && "td-off")}>{k.answer}</span>
              </div>
              <div className="k-ops">
                <ActionBtn className="btn-sm" onClick={() => toggleK(k)}>
                  {k.enabled ? "DISABLE" : "ENABLE"}
                </ActionBtn>
                <ActionBtn variant="danger" className="btn-sm" onClick={() => removeK(k)}>✕</ActionBtn>
              </div>
            </div>
          ))}
          {knowledge.length === 0 && (
            <p className="note">No knowledge entries yet. FAQ text below helps the local engine answer richly.</p>
          )}
        </div>

        <div className="k-add">
          <span className="flabel">ADD KNOWLEDGE</span>
          <div className="pair">
            <Input placeholder="Question" value={newQ.question} onChange={(e) => setNewQ({ ...newQ, question: e.target.value })} />
            <select className="input select k-type" value={newQ.type} onChange={(e) => setNewQ({ ...newQ, type: e.target.value })}>
              <option value="FAQ">FAQ</option>
              <option value="CUSTOM">CUSTOM</option>
            </select>
          </div>
          <Textarea rows={3} placeholder="Answer" value={newQ.answer} onChange={(e) => setNewQ({ ...newQ, answer: e.target.value })} />
        </div>
        <ActionBtn className="btn-sm" onClick={() => addK().catch(() => {})}>+ ADD KNOWLEDGE</ActionBtn>
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addTechnologyAction, deleteTechnologyAction, updateTechnologyCategoryAction } from "@/actions/project-actions";
import { notify } from "@/components/admin/toast";
import { Field, Input, SubmitBtn, Card, ActionBtn } from "@/components/admin/ui";
import { TECH_CATEGORIES } from "@/lib/constants";

type Tech = { id: string; name: string; category: string; _count: { projects: number } };

export function TechManager({ techs }: { techs: Tech[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Development");
  const [busy, setBusy] = useState(false);

  const groups = Array.from(new Set(techs.map((t) => t.category))).sort();

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await addTechnologyAction(name, category);
    setBusy(false);
    notify(res.message, res.ok);
    setName("");
    router.refresh();
  }

  async function remove(t: Tech, force: boolean) {
    const res = await deleteTechnologyAction(t.id, force);
    notify(res.message, res.ok);
    router.refresh();
  }

  async function recat(t: Tech, c: string) {
    const res = await updateTechnologyCategoryAction(t.id, c);
    notify(res.message, res.ok);
    router.refresh();
  }

  return (
    <div className="stack">
      <Card title="ADD TECHNOLOGY">
        <div className="pair">
          <Field label="NAME" className="grow">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="React" />
          </Field>
          <Field label="CATEGORY">
            <select
              className="input select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {TECH_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <SubmitBtn pending={busy ? "…" : undefined} onClick={() => add().catch(() => {})}>
            + ADD
          </SubmitBtn>
        </div>
      </Card>

      <div className="tech-grid">
        {groups.map((g) => (
          <div className="card" key={g}>
            <header className="card-head">
              <h2 className="card-title">{g.toUpperCase()}</h2>
              <span className="card-badge">{techs.filter((t) => t.category === g).length}</span>
            </header>
            <div className="tech-group">
              {techs
                .filter((t) => t.category === g)
                .map((t) => (
                  <div className="tech-line" key={t.id}>
                    <span className="tech-name">{t.name}</span>
                    <select
                      className="input select tech-recat"
                      value={t.category}
                      onChange={(e) => recat(t, e.target.value)}
                      title="Move to category"
                    >
                      {TECH_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="td-muted tech-uses">{t._count.projects} use{t._count.projects === 1 ? "" : "s"}</span>
                    <ActionBtn
                      variant="danger"
                      className="btn-sm"
                      onClick={() => {
                        if (t._count.projects > 0) {
                          if (confirm(`"${t.name}" is used by ${t._count.projects} project(s). Force delete (removes the links)?`)) {
                            remove(t, true);
                          }
                        } else {
                          remove(t, false);
                        }
                      }}
                    >
                      ✕
                    </ActionBtn>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
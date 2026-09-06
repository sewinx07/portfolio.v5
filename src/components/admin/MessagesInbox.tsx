"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMessageStatusAction, deleteMessageAction } from "@/actions/message-actions";
import { notify } from "@/components/admin/toast";
import { StatusBadge, Empty } from "@/components/admin/ui";
import { formatDateTime, cn } from "@/lib/utils";

type Msg = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
};

export function MessagesInbox({ messages }: { messages: Msg[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");

  const filtered = messages.filter((m) => filter === "ALL" || m.status === filter);
  const counts = {
    NEW: messages.filter((m) => m.status === "NEW").length,
    READ: messages.filter((m) => m.status === "READ").length,
  };

  async function setStatus(m: Msg, status: string) {
    const res = await setMessageStatusAction(m.id, status);
    notify(res.message, res.ok);
    router.refresh();
  }

  async function remove(m: Msg) {
    if (!confirm(`Delete message from ${m.name}?`)) return;
    const res = await deleteMessageAction(m.id);
    notify(res.message, res.ok);
    router.refresh();
  }

  const next = (m: Msg) => (m.status === "NEW" ? "READ" : m.status === "READ" ? "NEW" : "READ");

  return (
    <>
      <div className="tabs">
        {["ALL", "NEW", "READ"].map((k) => (
          <button key={k} className={cn("tab", filter === k && "active")} onClick={() => setFilter(k)}>
            {k}
            {k !== "ALL" && <span className="pk-count">{counts[k as "NEW" | "READ"]}</span>}
          </button>
        ))}
      </div>

      <div className="message-list">
        {filtered.length === 0 && <Empty title="No messages" text="Submitted contact forms will land here." />}
        {filtered.map((m) => (
          <article className={cn("message", m.status === "NEW" && "message-new")} key={m.id}>
            <header className="message-head">
              <div className="message-from">
                <span className="td-strong">{m.name}</span>
                <a className="td-sub" href={`mailto:${m.email}`}>{m.email}</a>
              </div>
              <StatusBadge status={m.status} />
            </header>
            {m.subject && <h3 className="message-subject">{m.subject}</h3>}
            <p className="message-body">{m.message}</p>
            <footer className="message-foot">
              <time className="td-muted">{formatDateTime(m.createdAt)}</time>
              <div className="message-ops">
                <button className="btn btn-ghost btn-sm" onClick={() => setStatus(m, next(m))}>
                  MARK {next(m) === "READ" ? "READ" : "UNREAD"}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>
                  DELETE
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
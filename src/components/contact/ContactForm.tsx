"use client";

import { useActionState } from "react";
import { submitContactAction } from "@/actions/message-actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; message: string }, fd: FormData) =>
      submitContactAction(fd),
    { ok: false, message: "" }
  );

  return (
    <form action={formAction}>
      <div className="form-grid">
        <label className="field">
          <span className="label">NAME</span>
          <input className="input" name="name" required maxLength={120} placeholder="Your name" />
        </label>
        <label className="field">
          <span className="label">EMAIL</span>
          <input className="input" name="email" type="email" required maxLength={120} placeholder="you@studio.com" />
        </label>
      </div>
      <label className="field">
        <span className="label">SUBJECT</span>
        <input className="input" name="subject" maxLength={200} placeholder="What is this about?" />
      </label>
      <label className="field">
        <span className="label">MESSAGE</span>
        <textarea className="input" name="message" required maxLength={8000} rows={6} placeholder="Tell me about the project…" />
      </label>

      <div className="form-foot">
        <button className="btn btn-solid" type="submit" disabled={pending}>
          {pending ? "SENDING…" : "SEND MESSAGE →"}
        </button>
        <p className={`form-feedback ${state?.ok ? "form-ok" : "form-err"}`} role="status" aria-live="polite">
          {state?.message ?? ""}
        </p>
      </div>
    </form>
  );
}
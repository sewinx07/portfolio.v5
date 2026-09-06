"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth-actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {
    ok: false,
    message: "",
  });

  return (
    <form className="login-form" action={formAction}>
      <div className="login-mark">T</div>
      <h1 className="login-title">CONTROL ROOM</h1>
      <p className="login-sub">Sign in to manage the portfolio.</p>

      <label className="field">
        <span className="flabel">EMAIL</span>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="username"
          required
          placeholder="admin@tahagmir.com"
        />
      </label>
      <label className="field">
        <span className="flabel">PASSWORD</span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </label>

      {state?.message && (
        <p className={`login-msg ${state.ok ? "ok" : "err"}`} role="status">
          {state.message}
        </p>
      )}

      <button className="btn btn-primary login-btn" type="submit" disabled={pending}>
        {pending ? "SIGNING IN…" : "SIGN IN"}
      </button>
    </form>
  );
}
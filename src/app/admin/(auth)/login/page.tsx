import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session && session.role !== "VIEWER") {
    redirect("/admin");
  }
  return (
    <main className="login-page">
      <LoginForm />
    </main>
  );
}
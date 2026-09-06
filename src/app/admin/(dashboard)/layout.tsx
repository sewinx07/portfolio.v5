import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role === "VIEWER") {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      user={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
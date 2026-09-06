import type { ReactNode } from "react";
import { AdminRootClass } from "@/components/admin/AdminRootClass";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminRootClass />
      {children}
    </>
  );
}
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { TechManager } from "@/components/admin/TechManager";

export const metadata: Metadata = {
  title: "Technologies",
  robots: { index: false },
};

export default async function AdminTechPage() {
  const techs = await db.technology.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { projects: true } } },
  });
  return <TechManager techs={techs} />;
}
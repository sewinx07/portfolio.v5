import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MessagesInbox } from "@/components/admin/MessagesInbox";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await db.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
  return <MessagesInbox messages={messages} />;
}
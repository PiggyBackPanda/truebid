import { redirect } from "next/navigation";

// Canonical URL is /dashboard/messages — redirect any hits on /messages
export default function MessagesRedirect() {
  redirect("/dashboard/messages");
}

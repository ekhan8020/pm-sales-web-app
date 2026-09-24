import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/current-session";

export default async function RootPage() {
  const session = await getCurrentSession();
  redirect(session ? "/drafts" : "/login");
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userHasPassword } from "@/lib/auth/has-password";

// Option B: Shared Layout Guard. 
// Chosen because the Node Postgres (pg) driver used by Drizzle is not edge-compatible, 
// meaning a DB lookup inside middleware.ts would fail. This layout wraps all protected routes.
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const hasPw = await userHasPassword(session.user.id);
  
  if (!hasPw) {
    redirect("/set-password");
  }

  return <>{children}</>;
}

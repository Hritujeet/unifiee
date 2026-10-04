import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userHasPassword } from "@/lib/auth/has-password";
import { getUserRole } from "@/actions/get-user-role";
import { redirect } from "next/navigation";

/**
 * Server-side OAuth / sign-in callback handler.
 * Routing logic:
 *   no session          → /sign-in
 *   no password         → /set-password
 *   new user (<60s)     → /onboarding
 *   existing manufacturer → /manufacturer
 *   existing designer  → /designer
 *   existing business   → /business
 *   everyone else       → /
 */
export default async function AuthCallbackPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const [hasPw, role] = await Promise.all([
    userHasPassword(session.user.id),
    getUserRole(),
  ]);

  if (!hasPw) {
    redirect("/set-password");
  }

  // New account just created — no role yet — send to onboarding
  const userCreatedAt = new Date(session.user.createdAt).getTime();
  if (Date.now() - userCreatedAt < 60000) {
    redirect("/onboarding");
  }

  // Returning registered users go straight to their dashboard
  if (role === "manufacturer") redirect("/manufacturer");
  if (role === "designer") redirect("/designer");
  if (role === "business") redirect("/business");

  // Registered but not yet onboarded
  redirect("/onboarding");
}

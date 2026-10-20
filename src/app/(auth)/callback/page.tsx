import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userHasPassword } from "@/lib/auth/has-password";
import { getUserRole } from "@/actions/get-user-role";
import { redirect } from "next/navigation";

/**
 * Server-side OAuth / sign-in callback handler.
 * Routing priority:
 *   1. No session          → /sign-in
 *   2. No password set     → /set-password
 *   3. Registered role:
 *        manufacturer      → /manufacturer
 *        designer          → /designer
 *        business          → /business
 *   4. No role registered  → /onboarding
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

  // Returning registered users go straight to their specific role dashboard
  if (role === "manufacturer") redirect("/manufacturer");
  if (role === "designer") redirect("/designer");
  if (role === "business") redirect("/business");

  // User has account and password, but has not completed onboarding
  redirect("/onboarding");
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userHasPassword } from "@/lib/auth/has-password";
import { redirect } from "next/navigation";

/**
 * Server-side OAuth callback handler.
 *
 * Previously this was a "use client" page that used useEffect + two extra
 * client→server round-trips (getSession then checkHasPasswordAction) before
 * deciding where to redirect. Now all logic runs on the server in a single
 * render, eliminating the extra round-trips and the visible loading flash.
 */
export default async function AuthCallbackPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const hasPw = await userHasPassword(session.user.id);
  if (!hasPw) {
    redirect("/set-password");
  }

  const userCreatedAt = new Date(session.user.createdAt).getTime();
  if (Date.now() - userCreatedAt < 60000) {
    redirect("/onboarding");
  }

  redirect("/");
}

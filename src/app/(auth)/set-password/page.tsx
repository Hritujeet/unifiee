import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Set Password — UNIFIÉE",
  description: "Set a password for your UNIFIÉE account to secure your procurement dashboard.",
  robots: { index: false },
};
import { headers } from "next/headers";
import { userHasPassword } from "@/lib/auth/has-password";
import { getUserRole } from "@/actions/get-user-role";
import { redirect } from "next/navigation";
import SetPasswordForm from "./set-password-form";

export default async function SetPasswordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. No session → /sign-in
  if (!session?.user) {
    redirect("/sign-in");
  }

  // 2. Check password and role in parallel for faster redirects
  const [hasPw, role] = await Promise.all([
    userHasPassword(session.user.id),
    getUserRole(),
  ]);

  if (hasPw) {
    if (role === "manufacturer") redirect("/manufacturer");
    if (role === "designer") redirect("/designer");
    if (role === "business") redirect("/business");

    redirect("/onboarding");
  }

  // 3. Render the form
  return <SetPasswordForm />;
}

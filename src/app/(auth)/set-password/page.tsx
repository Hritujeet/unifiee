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

  // 2. Already has a password — redirect to appropriate destination
  const hasPw = await userHasPassword(session.user.id);
  if (hasPw) {
    const role = await getUserRole();
    if (role === "manufacturer") redirect("/manufacturer");
    if (role === "designer") redirect("/manufacturer"); // temporary redirect until designer dashboard exists
    if (role === "business") redirect("/business");

    const userCreatedAt = new Date(session.user.createdAt).getTime();
    if (Date.now() - userCreatedAt < 60000) redirect("/onboarding");

    redirect("/onboarding");
  }

  // 3. Render the form
  return <SetPasswordForm />;
}

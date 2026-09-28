import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userHasPassword } from "@/lib/auth/has-password";
import { redirect } from "next/navigation";
import SetPasswordForm from "./set-password-form";

export default async function SetPasswordPage() {
  // userHasPassword depends on the session userId, so these must be sequential
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. No session -> redirect to /sign-in
  if (!session || !session.user) {
    redirect("/sign-in");
  }

  // 2. Session exists but already has a password -> skip to onboarding/home
  const hasPw = await userHasPassword(session.user.id);
  if (hasPw) {
    const userCreatedAt = new Date(session.user.createdAt).getTime();
    if (Date.now() - userCreatedAt < 60000) {
      redirect("/onboarding");
    }
    redirect("/");
  }

  // 3. Otherwise render the form
  return <SetPasswordForm />;
}

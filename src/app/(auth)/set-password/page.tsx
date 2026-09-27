import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userHasPassword } from "@/lib/auth/has-password";
import { redirect } from "next/navigation";
import SetPasswordForm from "./set-password-form";

export default async function SetPasswordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. No session -> redirect to /sign-in
  if (!session || !session.user) {
    redirect("/sign-in");
  }

  // 2. Session exists but userHasPassword is true -> redirect to the existing onboarding/home route
  const hasPw = await userHasPassword(session.user.id);
  if (hasPw) {
    const userCreatedAt = new Date(session.user.createdAt).getTime();
    const now = Date.now();
    
    if (now - userCreatedAt < 60000) {
      redirect("/onboarding");
    } else {
      redirect("/");
    }
  }

  // 3. Otherwise render the form
  return <SetPasswordForm />;
}

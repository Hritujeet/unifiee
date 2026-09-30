import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Get Started — UNIFIÉE",
  description: "Choose your role on UNIFIÉE — set up as a packaging vendor or an F&B business to get started with the platform.",
  robots: { index: false },
};
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userHasPassword } from "@/lib/auth/has-password";
import { getUserRole } from "@/actions/get-user-role";
import OnboardingForm from "@/components/site/onboarding-form";

export default async function OnboardingPage() {
    // 1. Must be signed in
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    // 2. Must have a password set
    const hasPw = await userHasPassword(session.user.id);
    if (!hasPw) redirect("/set-password");

    // 3. If already registered, redirect to the correct dashboard
    const role = await getUserRole();
    if (role === "vendor") redirect("/vendor");
    if (role === "business") redirect("/business");

    // 4. Not yet registered — show the onboarding selector
    return <OnboardingForm />;
}
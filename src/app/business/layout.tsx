import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userHasPassword } from "@/lib/auth/has-password";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { eq } from "drizzle-orm";
import RoleProvider from "@/components/providers/role-provider";

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
    // 1. Must be signed in
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    // 2. Must have a password set
    const hasPw = await userHasPassword(session.user.id);
    if (!hasPw) redirect("/set-password");

    // 3. Must be a registered business
    const businessRows = await db
        .select({ id: business.id })
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1);

    if (businessRows.length === 0) {
        // Signed in but not a business — send them to onboarding
        redirect("/onboarding");
    }

    return (
        <RoleProvider>
            {/* TODO: Add business header and sidebar */}
            {children}
        </RoleProvider>
    );
}
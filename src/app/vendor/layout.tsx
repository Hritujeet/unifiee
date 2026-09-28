import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userHasPassword } from "@/lib/auth/has-password";
import { db } from "@/lib/db";
import { vendorTable } from "@/lib/db/schema/vendor";
import { eq } from "drizzle-orm";
import RoleProvider from "@/components/providers/role-provider";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
    // 1. Must be signed in
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    // 2. Must have a password set
    const hasPw = await userHasPassword(session.user.id);
    if (!hasPw) redirect("/set-password");

    // 3. Must be a registered vendor
    const vendorRows = await db
        .select({ id: vendorTable.id })
        .from(vendorTable)
        .where(eq(vendorTable.userId, session.user.id))
        .limit(1);

    if (vendorRows.length === 0) {
        // Signed in but not a vendor — send them to onboarding
        redirect("/onboarding");
    }

    return (
        <RoleProvider>
            {/* TODO: Add vendor header and sidebar */}
            {children}
        </RoleProvider>
    );
}
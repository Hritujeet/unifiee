import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userHasPassword } from "@/lib/auth/has-password";
import { db } from "@/lib/db";
import { vendorTable } from "@/lib/db/schema/vendor";
import { eq } from "drizzle-orm";
import RoleProvider from "@/components/providers/role-provider";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/vendors/app-sidebar";
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
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:h-16">
                        <SidebarTrigger className="-ml-1" />
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </RoleProvider>
    );
}
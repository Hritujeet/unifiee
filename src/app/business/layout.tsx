import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userHasPassword } from "@/lib/auth/has-password";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { eq } from "drizzle-orm";
import RoleProvider from "@/components/providers/role-provider";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import BusinessAppSidebar from "@/components/business/app-sidebar";
import { AssistantPanel } from "@/components/ai/assistant-panel";

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
    // 1. Must be signed in
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    // 2 + 3. Run password check and business lookup in parallel
    const [hasPw, businessRows] = await Promise.all([
        userHasPassword(session.user.id),
        db
            .select({ id: business.id })
            .from(business)
            .where(eq(business.userId, session.user.id))
            .limit(1),
    ]);

    if (!hasPw) redirect("/set-password");

    if (businessRows.length === 0) {
        // Signed in but not a business — send them to onboarding
        redirect("/onboarding");
    }

    return (
        <RoleProvider>
            <SidebarProvider defaultOpen={true}>
                <BusinessAppSidebar />
                <SidebarInset className="min-w-0 bg-background text-foreground">
                    {/* Mobile header with sidebar trigger */}
                    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4 md:hidden">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <span className="text-sm font-semibold tracking-tight">Unifiée Business</span>
                        </div>
                    </header>
                    <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 min-w-0">
                        {children}
                    </main>
                    <AssistantPanel role="business" userName={session.user.name || undefined} />
                </SidebarInset>
            </SidebarProvider>
        </RoleProvider>
    );
}
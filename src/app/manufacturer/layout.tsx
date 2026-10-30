import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { userHasPassword } from "@/lib/auth/has-password";
import { db } from "@/lib/db";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { eq } from "drizzle-orm";
import RoleProvider from "@/components/providers/role-provider";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/manufacturer/app-sidebar";
import { AssistantPanel } from "@/components/ai/assistant-panel";
import { ThemeToggle } from "@/components/site/theme-toggle";

export default async function ManufacturerLayout({ children }: { children: React.ReactNode }) {
    // 1. Must be signed in
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    // 2 + 3. Run password check and manufacturer lookup in parallel
    const [hasPw, manufacturerRows] = await Promise.all([
        userHasPassword(session.user.id),
        db
            .select({ id: manufacturerTable.id })
            .from(manufacturerTable)
            .where(eq(manufacturerTable.userId, session.user.id))
            .limit(1),
    ]);

    if (!hasPw) redirect("/set-password");

    if (manufacturerRows.length === 0) {
        // Signed in but not a vendor — send them to onboarding
        redirect("/onboarding");
    }

    return (
        <RoleProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-md lg:h-16 lg:px-6">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="-ml-1 size-8 rounded-lg hover:bg-muted" />
                            <div className="hidden h-4 w-px bg-border/60 sm:block" />
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold tracking-tight text-foreground">UNIFIÉE</span>
                                <span className="text-muted-foreground/60">/</span>
                                <span className="text-muted-foreground">Manufacturer Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Live Marketplace Indicator */}
                            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                </span>
                                <span>Catalog Live</span>
                            </div>

                            <Link
                                href="/manufacturer/publish-offering"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                            >
                                <span className="text-sm leading-none">+</span>
                                <span>Post Offering</span>
                            </Link>
                            <ThemeToggle />
                        </div>
                    </header>
                    <main className="flex min-w-0 flex-1 flex-col gap-5 p-3 sm:p-4 md:gap-7 md:p-6 lg:p-8">
                        {children}
                    </main>
                    <AssistantPanel role="manufacturer" userName={session.user.name || undefined} />
                </SidebarInset>
            </SidebarProvider>
        </RoleProvider>
    );
}
import { auth } from "@/lib/auth"
import { userHasPassword } from "@/lib/auth/has-password"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { db } from "@/lib/db"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import DesignerAppSidebar from "@/components/designer/app-sidebar"
import RoleProvider from "@/components/providers/role-provider"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserRound } from "lucide-react"

export default async function DesignerLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/sign-in")

    const hasPassword = await userHasPassword(session.user.id)
    if (!hasPassword) redirect("/set-password")

    const designerRows = await db
        .select({ id: packagingDesignerTable.id })
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (designerRows.length === 0) redirect("/onboarding")

    return (
        <RoleProvider>
            <SidebarProvider>
                <DesignerAppSidebar />
                <SidebarInset>
                    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 lg:h-16 lg:px-7">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="-ml-1" />
                            <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:inline">Designer studio</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/designer/profile" className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                                <UserRound className="size-4" /><span className="hidden sm:inline">My profile</span>
                            </Link>
                        </div>
                    </header>
                    <main className="flex flex-1 flex-col gap-4 bg-background p-4 md:gap-8 md:p-7 lg:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </RoleProvider>
    )
}

import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export const metadata: Metadata = {
    title: "Designer Dashboard — UNIFIÉE",
    description: "Manage your designer profile and portfolio on UNIFIÉE.",
    robots: { index: false },
}

export default async function DesignerDashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const designer = session?.user
        ? (await db
            .select({
                fullName: packagingDesignerTable.fullName,
                displayName: packagingDesignerTable.displayName,
                headline: packagingDesignerTable.headline,
                availabilityStatus: packagingDesignerTable.availabilityStatus,
                portfolioUrl: packagingDesignerTable.portfolioUrl,
            })
            .from(packagingDesignerTable)
            .where(eq(packagingDesignerTable.userId, session.user.id))
            .limit(1))[0]
        : undefined

    const designerName = designer?.displayName || designer?.fullName || "Designer"

    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Designer workspace</p>
                <h1 className="text-3xl font-semibold tracking-tight">Welcome, {designerName}</h1>
                <p className="text-muted-foreground">
                    Manage your design profile and portfolio from your dashboard.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border bg-card p-5">
                    <h2 className="font-semibold">Your profile</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {designer?.headline || "Add a headline to introduce your design services."}
                    </p>
                    <p className="mt-4 text-sm">
                        Availability: <span className="capitalize">{designer?.availabilityStatus || "Not set"}</span>
                    </p>
                </article>
                <article className="rounded-xl border bg-card p-5">
                    <h2 className="font-semibold">Portfolio</h2>
                    {designer?.portfolioUrl ? (
                        <a
                            className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
                            href={designer.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View your portfolio
                        </a>
                    ) : (
                        <p className="mt-2 text-sm text-muted-foreground">Your portfolio link will appear here.</p>
                    )}
                </article>
            </div>
        </section>
    )
}

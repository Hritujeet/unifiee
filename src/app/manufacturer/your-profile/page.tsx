import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { manufacturerTable } from '@/lib/db/schema/manufacturer'
import { eq } from 'drizzle-orm'
import { FacilityProfileView } from '@/components/manufacturer/facility-profile-view'

export const metadata: Metadata = {
    title: "Vendor Profile — UNIFIÉE",
    description: "View and manage your registered vendor profile on UNIFIÉE.",
    robots: { index: false },
}

export default async function ManufacturerProfilePage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null

    const rows = await db
        .select()
        .from(manufacturerTable)
        .where(eq(manufacturerTable.userId, session.user.id))
        .limit(1)

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground text-sm">Vendor profile not found.</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <FacilityProfileView profile={rows[0]} />
        </div>
    )
}
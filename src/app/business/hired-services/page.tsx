import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Briefcase, CheckCircle2, Layers, Palette, Sparkles } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Button } from "@/components/ui/button"
import { HiredServicesManager } from "@/components/business/hired-services-manager"
import { getBusinessHiredServices } from "@/lib/business/marketplace"

export const metadata: Metadata = {
    title: "Hired Services — UNIFIÉE Business",
    description: "Manage and track active and completed packaging design projects and artwork deliverables.",
    robots: { index: false },
}

export default async function BusinessHiredServicesPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const services = session?.user ? await getBusinessHiredServices(session.user.id) : []

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-8">
            {/* 1. Header with Breadcrumb & Marketplace Link */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-2">
                        <Briefcase className="size-3" />
                        <span>Project Workspace</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                        Hired Services & Project Tracker
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                        Monitor active packaging design milestones, communicate with artists, and finalize print-ready dielines for manufacturing.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <Button asChild variant="outline" size="sm" className="text-xs h-9">
                        <Link href="/business/designers" className="flex items-center gap-1.5">
                            <Palette className="size-3.5 text-blue-500" />
                            <span>Browse Designers</span>
                            <ArrowRight className="size-3 text-muted-foreground" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 2. Tracker Manager Component */}
            <HiredServicesManager services={services} />
        </div>
    )
}

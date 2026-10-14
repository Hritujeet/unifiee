import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"

export const metadata: Metadata = {
    title: "Requirements — UNIFIÉE Business",
    description: "Manage your packaging requirements and vendor sourcing on UNIFIÉE.",
    robots: { index: false },
}

interface RequirementItem {
    id: string
    title: string
    category: string
    quantity: string
    status: "offers_received" | "in_production" | "draft" | "reviewing"
    statusText: string
    offersCount: number
    createdAt: string
}

const sampleRequirements: RequirementItem[] = [
    {
        id: "req-1",
        title: "Pizza box 12 in",
        category: "Corrugated Box",
        quantity: "1,000 units",
        status: "offers_received",
        statusText: "3 offers received",
        offersCount: 3,
        createdAt: "2 days ago",
    },
    {
        id: "req-2",
        title: "Paper cups 8 oz",
        category: "Paper Cups",
        quantity: "5,000 units",
        status: "in_production",
        statusText: "In production",
        offersCount: 1,
        createdAt: "5 days ago",
    },
]

export default function BusinessRequirementsPage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">Requirements</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track your packaging requests, review matching vendor offers, and push projects into production.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild className="h-9 bg-blue-600 hover:bg-blue-500 text-white font-medium">
                        <Link href="/business/requirements/new">
                            <Plus className="size-4 mr-1.5" /> New requirement
                        </Link>
                    </Button>
                </div>
            </div>

            {/* AI intake prompt card */}
            <Card size="sm" className="border-border/50 bg-linear-to-r from-blue-600/10 via-card to-card py-5">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-0 px-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-blue-500" />
                            <h2 className="text-sm font-semibold text-foreground">Start with AI intake</h2>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-xl">
                            Describe what you need in plain words. We automatically structure it into a technical requirement and match certified packaging vendors.
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                        <Link href="/business/requirements/new">Describe your packaging <ArrowRight className="size-3.5 ml-1.5" /></Link>
                    </Button>
                </CardContent>
            </Card>

            {/* List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
                    <span>Active requirements ({sampleRequirements.length})</span>
                    <span>Sorted by newest</span>
                </div>

                <div className="grid gap-3">
                    {sampleRequirements.map((req) => (
                        <Card
                            key={req.id}
                            size="sm"
                            className="transition-all hover:border-border py-4"
                        >
                            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-0 px-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-foreground">{req.title}</span>
                                        <Badge variant="secondary" className="text-[11px] font-medium">
                                            {req.category}
                                        </Badge>
                                        <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                                            {req.quantity}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Clock className="size-3" /> Created {req.createdAt}</span>
                                        <span>•</span>
                                        <span className="font-medium text-blue-500">{req.offersCount} offers received</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    {req.offersCount > 0 && req.status === "offers_received" ? (
                                        <Button asChild size="sm" className="h-8 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-medium">
                                            <Link href="/business/offers">Review offers</Link>
                                        </Button>
                                    ) : (
                                        <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium">
                                            <Link href="/business/orders">View order</Link>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

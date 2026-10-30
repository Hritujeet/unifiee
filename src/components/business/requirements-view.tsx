"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    Clock,
    Layers,
    Loader2,
    MapPin,
    Package,
    Plus,
    Radio,
    Search,
    Sparkles,
    Tag,
    Trash2,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Requirement,
    OrderWorkflowStatus,
} from "@/lib/business/types"
import type { BusinessRequirement } from "@/lib/db/schema/business-requirement"
import type { BusinessQuoteSummary, BusinessOrderSummary } from "@/actions/order-actions"
import { deleteRequirementAction } from "@/actions/business-requirements"
import { RequirementVendorSearch } from "@/components/business/requirement-vendor-search"
import { toast } from "sonner"

export interface RequirementsViewProps {
    initialDbRequirements?: BusinessRequirement[]
    initialQuotes?: BusinessQuoteSummary[]
    initialOrders?: BusinessOrderSummary[]
}

const statusMap: Record<string, OrderWorkflowStatus> = {
    requirement_received: "Requirement Received",
    quoted: "Quoted",
    order_confirmed: "Order Confirmed",
    in_production: "In Production",
    shipped: "Shipped",
    delivered: "Delivered",
}

export default function RequirementsView({
    initialDbRequirements = [],
    initialQuotes = [],
    initialOrders = [],
}: RequirementsViewProps) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Map database requirements to the Requirement interface
    const dbRequirements: Requirement[] = initialDbRequirements.map((dbReq) => ({
        id: dbReq.id,
        title: dbReq.title,
        packagingUse: dbReq.packagingUse,
        packagingType: dbReq.packagingType,
        quantity: dbReq.quantity,
        size: dbReq.size,
        material: dbReq.material,
        brandingNeeded: dbReq.brandingNeeded,
        deliveryLocation: dbReq.deliveryLocation,
        requiredByDate: dbReq.requiredByDate,
        status: statusMap[dbReq.status] || "Requirement Received",
        createdAt: new Date(dbReq.createdAt).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }),
        quotesCount: initialQuotes.filter((quote) => quote.requirementId === dbReq.id).length,
        rawDescription: dbReq.rawDescription || undefined,
    }))

    const requirements = dbRequirements

    const handleDelete = async (id: string, title: string) => {
        setDeletingId(id)
        try {
            const res = await deleteRequirementAction(id)
            if (!res.success) {
                toast.error(res.error || "Failed to delete requirement.")
                setDeletingId(null)
                return
            }
            toast.success(`Requirement "${title}" deleted from database.`)
            router.refresh()
        } catch {
            toast.error("Could not delete requirement.")
        } finally {
            setDeletingId(null)
        }
    }

    const filteredRequirements = requirements.filter((req) => {
        const matchesStatus = statusFilter === "all" || req.status === statusFilter
        const matchesSearch =
            searchQuery.trim() === "" ||
            req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.packagingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.packagingUse.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.deliveryLocation.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesStatus && matchesSearch
    })

    const pendingOffersCount = initialQuotes.filter((quote) => quote.status === "pending").length
    const quotedCount = requirements.filter((r) => r.status === "Quoted").length
    const confirmedCount = initialOrders.filter(({ order }) =>
        ["confirmed", "proof_pending", "proof_approved", "in_production", "quality_check", "dispatched", "delivered", "completed"].includes(order.status)
    ).length

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 text-foreground">
            {/* 1. PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-border/40 pb-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Layers className="size-3" />
                        <span>Client Procurement</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                        Packaging Requirements
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        Save private requirements, then search active vendor offerings when you choose.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button asChild variant="outline" size="sm" className="h-10 px-4 rounded-xl text-xs font-medium border-border/50 hover:bg-muted/50">
                        <Link href="/business/offers" className="flex items-center gap-2">
                            <Tag className="size-3.5 text-amber-500" />
                            <span>View offers</span>
                            {pendingOffersCount > 0 && (
                                <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-semibold">
                                    {pendingOffersCount}
                                </span>
                            )}
                        </Link>
                    </Button>
                    {/* Primary Button */}
                    <Button asChild size="sm" className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm hover:shadow-md transition-all">
                        <Link href="/business/requirements/new" className="flex items-center gap-1.5">
                            <Plus className="size-4" />
                            <span>New requirement</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 2. AI INTAKE BANNER */}
            <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 shadow-xs mt-0.5">
                            <Sparkles className="size-5" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold tracking-wider uppercase text-blue-500">
                                    AI-Assisted Intake
                                </span>
                                <Badge variant="outline" className="text-[10px] border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">
                                    Structured Fields
                                </Badge>
                            </div>
                            <h2 className="text-base sm:text-lg font-semibold text-foreground">
                                Plain language in → 8 structured fields out
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                                Your saved requirements stay private. Use “Find matching vendors” on any requirement to search the catalog.
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center md:self-center">
                        <Button asChild variant="outline" className="h-10 px-5 rounded-xl border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-medium text-xs sm:text-sm shadow-xs gap-2">
                            <Link href="/business/requirements/new">
                                <span>Submit new requirement</span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 3. METRIC STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Requirements</CardTitle>
                        <Layers className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{requirements.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Saved privately</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Offers to Review</CardTitle>
                        <Tag className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{pendingOffersCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Vendor offers awaiting your decision</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Confirmed / In Production</CardTitle>
                        <Package className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{confirmedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Moved into active manufacturing</p>
                    </CardContent>
                </Card>
            </div>

            {/* 4. TOOLBAR: SEARCH & STATUS TABS */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40 w-fit overflow-x-auto max-w-full">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            All ({requirements.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("Quoted")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                statusFilter === "Quoted" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Quoted ({quotedCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("In Production")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                statusFilter === "In Production" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            In Production ({requirements.filter((r) => r.status === "In Production").length})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by use, type, city..."
                            className="h-9 w-full pl-9 text-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 5. REQUIREMENTS LIST */}
                {filteredRequirements.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                            <Layers className="size-8 mx-auto text-muted-foreground/50" />
                            <h3 className="text-base font-semibold text-foreground">No requirements found</h3>
                            <p className="text-xs text-muted-foreground">
                                No requirements match your active filter. Save a requirement to search vendor offerings privately.
                            </p>
                            <Button asChild size="sm" className="mt-2 text-xs">
                                <Link href="/business/requirements/new">Submit requirement</Link>
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredRequirements.map((req) => (
                            <Card key={req.id} className="hover:border-border transition-all">
                                <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                                                {req.title}
                                            </CardTitle>
                                            <Badge variant="secondary" className="text-xs capitalize font-medium">
                                                {req.packagingType} ({req.packagingUse})
                                            </Badge>
                                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                                {req.quantity}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs">
                                            {req.material} • Dimensions: {req.size}
                                        </CardDescription>
                                    </div>

                                    {/* Status Badge */}
                                    <Badge
                                        variant="outline"
                                        className={`text-xs px-2.5 py-1 font-semibold self-start shrink-0 ${
                                            req.status === "Quoted"
                                                ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                                : req.status === "In Production" || req.status === "Order Confirmed"
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                                : "border-blue-500/30 bg-blue-500/10 text-blue-500"
                                        }`}
                                    >
                                        {req.status}
                                    </Badge>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* The 8 canonical structured fields from Section 5 */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-muted/20 p-3 rounded-lg border border-border/40">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Use</span>
                                            <span className="font-medium text-foreground capitalize">{req.packagingUse}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Type</span>
                                            <span className="font-medium text-foreground capitalize">{req.packagingType}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Custom Print</span>
                                            <span className="font-medium text-foreground">{req.brandingNeeded ? "Yes (Branded)" : "No (Plain)"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Needed By</span>
                                            <span className="font-medium text-foreground">{req.requiredByDate}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3 text-muted-foreground/70" />
                                                {req.deliveryLocation}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3 text-muted-foreground/70" />
                                                Created {req.createdAt}
                                            </span>
                                        </div>
                                        <RequirementVendorSearch requirementId={req.id} />

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            {(() => {
                                                const pendingForReq = initialQuotes.filter((quote) => quote.requirementId === req.id && quote.status === "pending")
                                                const acceptedForReq = initialQuotes.some((quote) => quote.requirementId === req.id && quote.status === "accepted")
                                                const relatedOrder = initialOrders.some(({ order }) => order.quoteId && initialQuotes.some((quote) => quote.id === order.quoteId && quote.requirementId === req.id))

                                                if (pendingForReq.length > 0) {
                                                    return (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            className="h-8 px-3 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold"
                                                        >
                                                            <Link href="/business/offers" className="flex items-center gap-1.5">
                                                                <span>Review {pendingForReq.length} offer{pendingForReq.length > 1 ? "s" : ""}</span>
                                                                <ArrowRight className="size-3" />
                                                            </Link>
                                                        </Button>
                                                    )
                                                }

                                                if (acceptedForReq || relatedOrder) {
                                                    return (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-3 rounded-lg text-xs font-semibold border-border/60 hover:bg-muted"
                                                        >
                                                            <Link href="/business/orders" className="flex items-center gap-1.5">
                                                                <span>Track order</span>
                                                                <ArrowRight className="size-3" />
                                                            </Link>
                                                        </Button>
                                                    )
                                                }

                                                return (
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <Radio className="size-3 text-blue-500 animate-pulse" />
                                                        Saved privately • Search vendors when ready
                                                    </span>
                                                )
                                            })()}

                                            {/* Delete requirement button for DB-persisted records */}
                                            {req.id.includes("-") && req.id.length >= 32 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={deletingId === req.id}
                                                    onClick={() => handleDelete(req.id, req.title)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    title="Delete requirement"
                                                >
                                                    {deletingId === req.id ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="size-3.5" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

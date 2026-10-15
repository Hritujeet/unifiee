"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    ExternalLink,
    Palette,
    Plus,
    Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useWorkflowStore } from "@/lib/business-workflow-store"
import { toast } from "sonner"

export interface BusinessDashboardProps {
    businessName: string
}

const getStageIndex = (status: string): number => {
    switch (status) {
        case "Requirement Received":
            return 1
        case "Quoted":
            return 2
        case "Order Confirmed":
            return 3
        case "In Production":
            return 4
        case "Shipped":
            return 5
        case "Delivered":
            return 6
        default:
            return 3
    }
}

export default function BusinessDashboardView({ businessName }: BusinessDashboardProps) {
    const requirements = useWorkflowStore((s) => s.requirements)
    const quotations = useWorkflowStore((s) => s.quotations)
    const orders = useWorkflowStore((s) => s.orders)
    const acceptQuote = useWorkflowStore((s) => s.acceptQuote)

    const [isOffersModalOpen, setIsOffersModalOpen] = useState(false)
    const [isProofModalOpen, setIsProofModalOpen] = useState(false)
    const [proofApproved, setProofApproved] = useState(false)

    const pendingOffers = quotations.filter((q) => q.status === "pending")
    const activeOrders = orders.filter((o) => o.status !== "Delivered")
    const openRequirements = requirements.filter(
        (r) => r.status === "Requirement Received" || r.status === "Quoted"
    )

    // Calculate dynamic review queue items per Component 3 of Dashboard memo
    const hasPendingOffers = pendingOffers.length > 0
    const hasPendingProof = !proofApproved
    const reviewItemsCount = (hasPendingOffers ? 1 : 0) + (hasPendingProof ? 1 : 0)

    // Total spend this month
    const totalSpend = orders
        .filter((o) => o.paid)
        .reduce((acc, curr) => {
            const num = parseInt(curr.totalPrice.replace(/[^0-9]/g, ""), 10) || 0
            return acc + num
        }, 0)

    const formattedSpend =
        totalSpend > 0 ? `₹${totalSpend.toLocaleString("en-IN")}` : "₹0"

    return (
        <div className="mx-auto w-full max-w-6xl space-y-7 text-foreground">
            {/* 1. TOP BAR & GREETING LINE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
                        Good morning, {businessName || "Unifiée"}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {reviewItemsCount > 0
                            ? `${reviewItemsCount} item${reviewItemsCount > 1 ? "s are" : " is"} waiting for your review.`
                            : "No items are waiting for your review."}
                    </p>
                </div>

                {/* Single Primary Action: ONLY filled button on page per memo rules */}
                <Button
                    asChild
                    className="h-9 sm:h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs self-start sm:self-auto shrink-0"
                >
                    <Link href="/business/requirements/new" className="flex items-center gap-1.5">
                        <Plus className="size-4" />
                        <span>New requirement</span>
                    </Link>
                </Button>
            </div>

            {/* 2. NEEDS YOUR REVIEW (Attention queue) */}
            {/* If nothing is pending, this card is hidden rather than shown empty */}
            {reviewItemsCount > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-4 sm:px-5">
                        <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-foreground">
                            <span>Needs your review</span>
                        </CardTitle>
                        <Button
                            variant="link"
                            size="sm"
                            asChild
                            className="text-xs text-amber-500 hover:text-amber-400 p-0 h-auto"
                        >
                            <Link href="/business/offers">Review all</Link>
                        </Button>
                    </CardHeader>

                    <CardContent className="px-4 sm:px-5 pb-3 pt-0 space-y-2">
                        {/* Item A: Offers received for a requirement */}
                        {hasPendingOffers && (
                            <div className="flex items-center justify-between gap-3 py-1.5 text-xs sm:text-sm border-t border-border/40 first:border-t-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Tag className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
                                    <span className="truncate text-foreground font-medium">
                                        {pendingOffers.length} offer{pendingOffers.length > 1 ? "s" : ""} received for {pendingOffers[0]?.requirementTitle || "Packaging box"}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsOffersModalOpen(true)}
                                    className="h-7 px-3 text-xs font-medium rounded-md border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 shrink-0"
                                >
                                    Review offers
                                </Button>
                            </div>
                        )}

                        {/* Item B: Artwork proof ready */}
                        {hasPendingProof && (
                            <div className="flex items-center justify-between gap-3 py-1.5 text-xs sm:text-sm border-t border-border/40 first:border-t-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Palette className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
                                    <span className="truncate text-foreground font-medium">
                                        Artwork proof ready for Paper cups 8 oz
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsProofModalOpen(true)}
                                    className="h-7 px-3 text-xs font-medium rounded-md border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 shrink-0"
                                >
                                    Review proof
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 3. KPI ROW (Four cards, all user's own data) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card className="p-4 hover:border-border transition-all">
                    <Link href="/business/requirements" className="block space-y-1">
                        <span className="text-xs text-muted-foreground font-normal">
                            Open requirements
                        </span>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {openRequirements.length}
                        </div>
                    </Link>
                </Card>

                <Card className="p-4 hover:border-border transition-all">
                    <Link href="/business/offers" className="block space-y-1">
                        <span className="text-xs text-muted-foreground font-normal">
                            Offers to review
                        </span>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {pendingOffers.length}
                        </div>
                    </Link>
                </Card>

                <Card className="p-4 hover:border-border transition-all">
                    <Link href="/business/orders" className="block space-y-1">
                        <span className="text-xs text-muted-foreground font-normal">
                            Orders in progress
                        </span>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {activeOrders.length}
                        </div>
                    </Link>
                </Card>

                <Card className="p-4 hover:border-border transition-all">
                    <Link href="/business/orders" className="block space-y-1">
                        <span className="text-xs text-muted-foreground font-normal">
                            Spend this month
                        </span>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {formattedSpend}
                        </div>
                    </Link>
                </Card>
            </div>

            {/* 4. MAIN TWO-COLUMN SECTION */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                {/* LEFT (2 Cols): Active Orders with 6-stage milestone bar */}
                <div className="lg:col-span-2">
                    <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 sm:px-5">
                            <CardTitle className="text-sm font-semibold text-foreground">
                                Active orders
                            </CardTitle>
                            <Button
                                variant="link"
                                size="sm"
                                asChild
                                className="text-xs text-blue-500 hover:text-blue-400 p-0 h-auto"
                            >
                                <Link href="/business/orders">Review all orders</Link>
                            </Button>
                        </CardHeader>

                        <CardContent className="px-4 sm:px-5 pb-4 pt-0">
                            {/* Sub-header labels */}
                            <div className="hidden sm:grid grid-cols-[1.2fr_2fr_90px] gap-4 pb-2.5 text-[11px] text-muted-foreground font-medium border-b border-border/40">
                                <span>Order</span>
                                <span>Requirement • Offers • Order • Production • QC • Delivery</span>
                                <span className="text-right">Status</span>
                            </div>

                            {/* Orders list */}
                            <div className="divide-y divide-border/40">
                                {orders.slice(0, 5).map((order) => {
                                    const stageIndex = getStageIndex(order.status)
                                    return (
                                        <div
                                            key={order.id}
                                            className="py-3 flex flex-col sm:grid sm:grid-cols-[1.2fr_2fr_90px] gap-2.5 sm:gap-4 sm:items-center text-xs"
                                        >
                                            {/* Column 1: Order name & vendor */}
                                            <div className="min-w-0">
                                                <div className="font-semibold text-foreground text-xs sm:text-sm truncate">
                                                    {order.requirementTitle}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                    {order.vendorName}
                                                </div>
                                            </div>

                                            {/* Column 2: 6-segment stage bar */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 w-full">
                                                    {[1, 2, 3, 4, 5, 6].map((step) => {
                                                        const isFilled = step <= stageIndex
                                                        return (
                                                            <span
                                                                key={step}
                                                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                                    isFilled
                                                                        ? "bg-blue-600"
                                                                        : "bg-muted"
                                                                }`}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                                <div className="sm:hidden text-[10px] text-muted-foreground">
                                                    Stage {stageIndex} of 6
                                                </div>
                                            </div>

                                            {/* Column 3: Status label */}
                                            <div className="text-left sm:text-right font-medium text-foreground text-xs">
                                                {order.status === "In Production"
                                                    ? "In production"
                                                    : order.status === "Quoted"
                                                    ? "Offers in"
                                                    : order.status}
                                            </div>
                                        </div>
                                    )
                                })}

                                {orders.length === 0 && (
                                    <div className="py-8 text-center text-xs text-muted-foreground">
                                        No active orders yet. Submit your first requirement to receive offers.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT (1 Col): AI Intake, Explore & Recent Activity Cards */}
                <div className="space-y-4">
                    {/* Component 6: Start with AI intake */}
                    <Card className="border-border/60">
                        <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                            <CardTitle className="text-xs sm:text-sm font-semibold">
                                Start with AI intake
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-5 pb-4 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Describe what you need. We turn it into a requirement and match vendors.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="w-full text-xs font-medium rounded-lg h-9 hover:bg-muted"
                            >
                                <Link href="/business/requirements/new">
                                    Describe your packaging
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Component 7: Explore card */}
                    <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
                            <CardTitle className="text-xs sm:text-sm font-semibold">
                                Explore
                            </CardTitle>
                            <Button
                                variant="link"
                                size="sm"
                                asChild
                                className="text-xs text-blue-500 hover:text-blue-400 p-0 h-auto"
                            >
                                <Link href="/business/explore">Open</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-5 pb-4 space-y-2.5">
                            <Link
                                href="/business/explore"
                                className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                <span className="flex items-center gap-2">
                                    <Building2 className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                                    <span>Explore vendors</span>
                                </span>
                                <ArrowRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </Link>

                            <Link
                                href="/business/explore"
                                className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                <span className="flex items-center gap-2">
                                    <Palette className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                                    <span>Explore designers</span>
                                </span>
                                <ArrowRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Component 8: Recent activity */}
                    <Card className="border-border/60">
                        <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                            <CardTitle className="text-xs sm:text-sm font-semibold">
                                Recent activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-5 pb-4 text-xs text-muted-foreground space-y-2">
                            <div className="flex items-center justify-between">
                                <span>Offer received</span>
                                <span className="text-[11px] text-muted-foreground/70">2h ago</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Requirement submitted</span>
                                <span className="text-[11px] text-muted-foreground/70">1d ago</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Profile completed</span>
                                <span className="text-[11px] text-muted-foreground/70">2d ago</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom sample data note per mockup */}
            <div className="text-[11px] text-muted-foreground/70 border-t border-border/40 pt-4">
                Sample data. Dashboard shows only your own work; full vendor and designer browsing lives in the sidebar.
            </div>

            {/* MODAL 1: QUICK OFFERS REVIEW DIALOG */}
            <Dialog open={isOffersModalOpen} onOpenChange={setIsOffersModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Pending Vendor Offers
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Review and accept a supplier offer to confirm your order into production.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
                        {pendingOffers.map((q) => (
                            <Card key={q.id} className="p-4 space-y-3 border-border/60">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="font-semibold text-foreground text-sm">{q.vendorName}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {q.vendorLocation} • Delivery: {q.deliveryEstimate}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-base font-bold text-foreground">
                                            {q.unitPrice} <span className="text-xs font-normal text-muted-foreground">/ unit</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Total: {q.totalPrice} ({q.quantity})</div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        acceptQuote(q.id)
                                        setIsOffersModalOpen(false)
                                        toast.success(`Offer from ${q.vendorName} accepted! Created order for ${q.requirementTitle}.`)
                                    }}
                                    className="w-full h-8 text-xs font-medium hover:bg-muted"
                                >
                                    Accept offer
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <DialogFooter className="flex flex-row justify-between items-center sm:justify-between pt-2">
                        <Button variant="link" size="sm" asChild className="text-xs text-blue-500 hover:underline p-0 h-auto">
                            <Link href="/business/offers" className="flex items-center gap-1">
                                <span>Open all offers</span>
                                <ExternalLink className="size-3" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsOffersModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: ARTWORK PROOF REVIEW DIALOG */}
            <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Artwork Proof Review
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Paper cups 8 oz • EcoPack Solutions
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-xs">
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground">Specification sheet</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500">
                                    Version 1.0
                                </span>
                            </div>
                            <div className="space-y-1 text-muted-foreground">
                                <div>• Material: Double-wall food grade kraft board</div>
                                <div>• Print: 2-color CMYK brand wrap</div>
                                <div>• Coating: Water-based biodegradable lining</div>
                                <div>• Batch size: 5,000 units</div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row justify-end items-center gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setIsProofModalOpen(false)
                                toast.info("Feedback sent to vendor designer.")
                            }}
                        >
                            Request revision
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setProofApproved(true)
                                setIsProofModalOpen(false)
                                toast.success("Artwork proof approved! Sent to production.")
                            }}
                        >
                            <CheckCircle2 className="size-3.5 mr-1 text-emerald-500" />
                            <span>Approve proof</span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

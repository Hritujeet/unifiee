"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    Clock,
    MapPin,
    Package,
    Search,
    ShieldCheck,
    Tag,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useWorkflowStore } from "@/lib/business-workflow-store"
import { toast } from "sonner"

export default function OffersView() {
    const quotations = useWorkflowStore((s) => s.quotations)
    const acceptQuote = useWorkflowStore((s) => s.acceptQuote)

    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted">("all")

    const handleAcceptQuote = (quoteId: string, vendorName: string, title: string) => {
        acceptQuote(quoteId)
        toast.success(`Quote from ${vendorName} accepted! Created order for ${title}.`)
    }

    const filteredQuotations = quotations.filter((item) => {
        const matchesTab = activeTab === "all" || item.status === activeTab
        const matchesQuery =
            searchQuery.trim() === "" ||
            item.requirementTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.vendorLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.packagingType.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesTab && matchesQuery
    })

    const pendingQuotes = quotations.filter((q) => q.status === "pending")
    const acceptedQuotes = quotations.filter((q) => q.status === "accepted")

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 text-foreground">
            {/* 1. PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-border/40 pb-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Tag className="size-3" />
                        <span>Supplier Offers (Eureka MVP Section 2 & 4)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                        Offers
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        Vendors submit offers with price, quantity, production time, and delivery estimates for your requirements. Review and accept an offer to confirm the order.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button asChild variant="outline" size="sm" className="h-10 px-4 rounded-xl text-xs font-medium border-border/50 hover:bg-muted/50">
                        <Link href="/business/requirements">
                            <span>Requirements</span>
                        </Link>
                    </Button>
                    <Button asChild size="sm" className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm hover:shadow-md transition-all">
                        <Link href="/business/orders" className="flex items-center gap-1.5">
                            <Package className="size-4" />
                            <span>Orders</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 2. ATTENTION BANNER */}
            {pendingQuotes.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-card p-5 shadow-xs sm:p-6">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-xs">
                                <Tag className="size-5" />
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                                        {pendingQuotes.length} offer{pendingQuotes.length > 1 ? "s" : ""} waiting for your review
                                    </h2>
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    Packaging suppliers have submitted competitive offers. Accept an offer to move into the 6-stage order fulfillment pipeline.
                                </p>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            onClick={() => setActiveTab("pending")}
                            className="shrink-0 h-9 px-4 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold shadow-xs"
                        >
                            View pending offers ({pendingQuotes.length})
                        </Button>
                    </div>
                </div>
            )}

            {/* 3. TOOLBAR: SEARCH & TABS */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40 w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTab("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            All offers ({quotations.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("pending")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                activeTab === "pending" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Pending review ({pendingQuotes.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("accepted")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                activeTab === "accepted" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Accepted ({acceptedQuotes.length})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by vendor, item, city..."
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

                {/* 4. OFFERS LIST */}
                {filteredQuotations.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                            <Tag className="size-8 mx-auto text-muted-foreground/50" />
                            <h3 className="text-base font-semibold text-foreground">No offers found</h3>
                            <p className="text-xs text-muted-foreground">
                                No offers match your active filter.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery("")
                                    setActiveTab("all")
                                }}
                                className="text-xs mt-2"
                            >
                                Reset filters
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredQuotations.map((quote) => (
                            <Card key={quote.id} className="hover:border-border transition-all">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        {/* Left: Product & Vendor details */}
                                        <div className="space-y-3 flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                                    {quote.requirementTitle}
                                                </h3>
                                                <Badge variant="secondary" className="text-xs capitalize font-medium">
                                                    {quote.packagingType}
                                                </Badge>
                                                {quote.status === "pending" && (
                                                    <Badge variant="outline" className="text-xs border-amber-500/30 bg-amber-500/10 text-amber-500 font-medium">
                                                        Awaiting your decision
                                                    </Badge>
                                                )}
                                                {quote.status === "accepted" && (
                                                    <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-medium flex items-center gap-1">
                                                        <CheckCircle2 className="size-3" />
                                                        Accepted
                                                    </Badge>
                                                )}
                                                {quote.status === "rejected" && (
                                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                                        Declined
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Vendor profile */}
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1.5 font-medium text-foreground">
                                                    <Building2 className="size-3.5 text-blue-500" />
                                                    {quote.vendorName}
                                                </span>
                                                <span className="flex items-center gap-1 text-[11px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                                                    <ShieldCheck className="size-3" />
                                                    Verified Packaging Vendor
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="size-3 text-muted-foreground/70" />
                                                    {quote.vendorLocation}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3 text-muted-foreground/70" />
                                                    Received {quote.receivedAt}
                                                </span>
                                            </div>

                                            {/* Section 4 fields: Production time & Delivery estimate */}
                                            <div className="grid grid-cols-2 gap-3 max-w-md pt-1 text-xs">
                                                <div className="border border-border/40 rounded-lg p-2.5 bg-muted/20">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Production Time</span>
                                                    <span className="font-medium text-foreground">{quote.productionTime}</span>
                                                </div>
                                                <div className="border border-border/40 rounded-lg p-2.5 bg-muted/20">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Delivery Estimate</span>
                                                    <span className="font-medium text-foreground">{quote.deliveryEstimate}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Pricing & Single-Click Accept Action */}
                                        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-border/30 shrink-0">
                                            {/* Pricing Block */}
                                            <div className="text-left sm:text-right">
                                                <div className="flex items-baseline sm:justify-end gap-1.5">
                                                    <span className="text-2xl font-bold tracking-tight text-foreground font-heading">
                                                        {quote.unitPrice}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        / unit
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Total: <strong className="text-foreground">{quote.totalPrice}</strong> ({quote.quantity})
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div>
                                                {quote.status === "pending" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAcceptQuote(quote.id, quote.vendorName, quote.requirementTitle)}
                                                        className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all"
                                                    >
                                                        Accept offer
                                                    </Button>
                                                )}

                                                {quote.status === "accepted" && (
                                                    <Button asChild size="sm" variant="outline" className="h-10 px-4 rounded-xl text-xs font-medium">
                                                        <Link href="/business/orders" className="flex items-center gap-1.5">
                                                            <span>Track Order</span>
                                                            <ArrowRight className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                )}

                                                {quote.status === "rejected" && (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Another quote was selected
                                                    </span>
                                                )}
                                            </div>
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

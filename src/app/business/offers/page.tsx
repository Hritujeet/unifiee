import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, Filter, Tag } from "lucide-react"
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
    title: "Offers — UNIFIÉE Business",
    description: "Review and compare received vendor offers for your packaging requirements on UNIFIÉE.",
    robots: { index: false },
}

interface OfferItem {
    id: string
    requirementTitle: string
    requirementCategory: string
    vendorName: string
    vendorLocation: string
    unitPrice: string
    totalPrice: string
    quantity: string
    leadTime: string
    status: "pending_review" | "accepted" | "declined"
    receivedAt: string
}

const sampleOffers: OfferItem[] = [
    {
        id: "off-1",
        requirementTitle: "Pizza box 12 in",
        requirementCategory: "Corrugated Box",
        vendorName: "Delta Eco Packs",
        vendorLocation: "Bhiwandi, Maharashtra",
        unitPrice: "₹17.20",
        totalPrice: "₹17,200",
        quantity: "1,000 units",
        leadTime: "12–14 days",
        status: "pending_review",
        receivedAt: "2 hours ago",
    },
    {
        id: "off-2",
        requirementTitle: "Pizza box 12 in",
        requirementCategory: "Corrugated Box",
        vendorName: "Apex Packaging Ltd.",
        vendorLocation: "Okhla, New Delhi",
        unitPrice: "₹18.00",
        totalPrice: "₹18,000",
        quantity: "1,000 units",
        leadTime: "8–10 days",
        status: "pending_review",
        receivedAt: "4 hours ago",
    },
    {
        id: "off-3",
        requirementTitle: "Pizza box 12 in",
        requirementCategory: "Corrugated Box",
        vendorName: "BoxKraft Industries",
        vendorLocation: "Surat, Gujarat",
        unitPrice: "₹19.50",
        totalPrice: "₹19,500",
        quantity: "1,000 units",
        leadTime: "6–7 days",
        status: "pending_review",
        receivedAt: "1 day ago",
    },
    {
        id: "off-4",
        requirementTitle: "Paper cups 8 oz",
        requirementCategory: "Paper Containers",
        vendorName: "GreenCup Solutions",
        vendorLocation: "Bengaluru, Karnataka",
        unitPrice: "₹2.40",
        totalPrice: "₹12,000",
        quantity: "5,000 units",
        leadTime: "15 days",
        status: "accepted",
        receivedAt: "3 days ago",
    },
]

export default function BusinessOffersPage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">Offers</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Review vendor proposals, compare pricing and lead times, and confirm packaging production.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="h-9">
                        <Link href="/business/requirements">View requirements</Link>
                    </Button>
                    <Button asChild size="sm" className="h-9 bg-blue-600 hover:bg-blue-500 text-white font-medium">
                        <Link href="/business/requirements/new">+ New requirement</Link>
                    </Button>
                </div>
            </div>

            {/* Attention banner */}
            <Card size="sm" className="border-amber-500/30 bg-amber-500/5 py-4">
                <CardContent className="flex items-center justify-between gap-4 p-0 px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                            <Tag className="size-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">3 offers waiting for your review</p>
                            <p className="text-xs text-muted-foreground">Vendors submitted bids for &ldquo;Pizza box 12 in&rdquo;. Review prices and select a partner.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Offers List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
                    <span>Showing {sampleOffers.length} offers</span>
                    <span className="flex items-center gap-1"><Filter className="size-3.5" /> Sorted by newest</span>
                </div>

                <div className="grid gap-3">
                    {sampleOffers.map((offer) => (
                        <Card
                            key={offer.id}
                            size="sm"
                            className="transition-all hover:border-border hover:shadow-xs py-4"
                        >
                            <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-0 px-4">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-foreground">{offer.requirementTitle}</span>
                                        <Badge variant="secondary" className="text-[11px] font-medium">
                                            {offer.requirementCategory}
                                        </Badge>
                                        {offer.status === "pending_review" ? (
                                            <Badge variant="outline" className="text-[11px] border-amber-500/30 bg-amber-500/10 text-amber-500 font-medium">
                                                Needs review
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-medium flex items-center gap-1">
                                                <CheckCircle2 className="size-3" /> Accepted
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground/80">{offer.vendorName}</span>
                                        <span>•</span>
                                        <span>{offer.vendorLocation}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Clock className="size-3" /> {offer.receivedAt}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
                                    <div className="text-left md:text-right">
                                        <div className="text-base font-bold text-foreground">{offer.unitPrice} <span className="text-xs font-normal text-muted-foreground">/ unit</span></div>
                                        <div className="text-xs text-muted-foreground">Total: {offer.totalPrice} ({offer.quantity})</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {offer.status === "pending_review" ? (
                                            <Button size="sm" className="h-8 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-medium">
                                                Review offer
                                            </Button>
                                        ) : (
                                            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium">
                                                <Link href="/business/orders">View order <ArrowRight className="size-3.5 ml-1" /></Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

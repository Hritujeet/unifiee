"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, CheckCircle2, ShoppingBag } from "lucide-react"
import { formatCategoryDisplayName } from "@/lib/constants/categories"

export interface BusinessOfferingItem {
    id: string
    title: string
    description: string
    offeringType: string
    unitPrice: string | number
    unitOfMeasure: string
    minOrderQuantity: number
    quantityStep?: number
    leadTimeDaysMin: number
    leadTimeDaysMax: number
    city: string
    state: string
    vendorName?: string | null
    fulfilmentMode?: string | null
    attributes?: Record<string, unknown> | null
    shippingTerms?: string | null
}

export interface OfferingCardProps {
    offering: BusinessOfferingItem
    onSelect?: (offering: BusinessOfferingItem) => void
    actionLabel?: string
    disabled?: boolean
}

export function OfferingCard({
    offering,
    onSelect,
    actionLabel = "View details & place order",
    disabled = false,
}: OfferingCardProps) {
    const unitPriceNum =
        typeof offering.unitPrice === "number"
            ? offering.unitPrice
            : parseFloat(String(offering.unitPrice)) || 0
    const minOrderValue = unitPriceNum * (offering.minOrderQuantity || 0)
    const attrs = (offering.attributes || {}) as Record<string, unknown>
    const fulfilment = (offering.fulfilmentMode || "made_to_order").replace(/_/g, " ")

    return (
        <Card className="border border-border hover:border-primary/40 shadow-xs transition-colors duration-150 bg-card overflow-hidden flex flex-col justify-between group rounded-xl">
            {/* Top Status & Fulfilment Banner - Identical to Live Buyer Directory Preview */}
            <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="truncate max-w-[200px]">
                        {offering.vendorName || "Verified Manufacturer"}
                    </span>
                </span>
                <Badge variant="outline" className="text-[9px] uppercase font-semibold tracking-wider">
                    {fulfilment}
                </Badge>
            </div>

            <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                    {/* Category & Title */}
                    <div className="space-y-1">
                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold capitalize">
                            {formatCategoryDisplayName(offering.offeringType)}
                        </Badge>
                        <h3
                            className="font-heading text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1"
                            title={offering.title}
                        >
                            {offering.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {offering.description}
                        </p>
                    </div>

                    {/* Material & Size / GSM pill badges */}
                    {Boolean(attrs.size || attrs.material || attrs.gsm) && (
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                            {attrs.size ? (
                                <span className="rounded bg-muted px-2 py-0.5 font-medium">
                                    {String(attrs.size)}
                                </span>
                            ) : null}
                            {attrs.material ? (
                                <span className="rounded bg-muted px-2 py-0.5 font-medium">
                                    {String(attrs.material)}
                                </span>
                            ) : null}
                            {attrs.gsm ? (
                                <span className="rounded bg-muted px-2 py-0.5 font-medium">
                                    {String(attrs.gsm)} GSM
                                </span>
                            ) : null}
                        </div>
                    )}

                    {/* Economics Display Box */}
                    <div className="rounded-xl bg-muted/50 p-3.5 space-y-2 border">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Unit Wholesale Price</span>
                            <span className="text-lg font-black text-foreground">
                                ₹{unitPriceNum > 0 ? unitPriceNum.toFixed(2) : "0.00"}
                                <span className="text-xs font-normal text-muted-foreground">
                                    {" "}
                                    / {offering.unitOfMeasure}
                                </span>
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                            <span>Min Order Batch</span>
                            <span className="font-semibold text-foreground">
                                {offering.minOrderQuantity.toLocaleString()} {offering.unitOfMeasure}s
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                            <span className="font-medium text-foreground">Min Order Value</span>
                            <span className="font-bold text-primary text-sm">
                                ₹{minOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Delivery & Logistics info */}
                    <div className="space-y-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-muted-foreground shrink-0" />
                            <span>
                                Lead Time:{" "}
                                <strong>
                                    {offering.leadTimeDaysMin}-{offering.leadTimeDaysMax} days
                                </strong>{" "}
                                turnaround
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span>
                                Ships from{" "}
                                <strong>
                                    {offering.city}, {offering.state}
                                </strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                            <span>Payments are arranged offline in this prototype</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                {onSelect && (
                    <div className="pt-3 border-t border-border/50">
                        <Button
                            type="button"
                            disabled={disabled}
                            className="w-full text-xs font-semibold h-9 shadow-xs gap-1.5"
                            onClick={() => onSelect(offering)}
                        >
                            <ShoppingBag className="size-3.5" />
                            {actionLabel}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export interface QuoteCardProps {
    quote: {
        id: string
        requirementId: string
        requirementTitle: string
        packagingType: string
        vendorId: string
        vendorName: string
        vendorLocation: string
        totalPrice: string | number
        unitPrice: string | number
        quantity: number
        productionTime: string
        deliveryEstimate: string
        status: string
        deliveryLocation: string
    }
    onAccept: () => void
    isProcessing: boolean
}

export function QuoteCard({ quote, onAccept, isProcessing }: QuoteCardProps) {
    const unitPriceNum =
        typeof quote.unitPrice === "number"
            ? quote.unitPrice
            : parseFloat(String(quote.unitPrice)) || 0
    const totalPriceNum =
        typeof quote.totalPrice === "number"
            ? quote.totalPrice
            : parseFloat(String(quote.totalPrice)) || 0

    return (
        <Card className="border border-border hover:border-primary/40 shadow-xs transition-colors duration-150 bg-card overflow-hidden flex flex-col justify-between group rounded-xl">
            {/* Top Status Banner */}
            <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <span
                        className={`size-2 rounded-full ${
                            quote.status === "pending"
                                ? "bg-emerald-500"
                                : quote.status === "accepted"
                                ? "bg-primary"
                                : "bg-muted-foreground"
                        }`}
                    />
                    <span className="truncate max-w-[200px]">{quote.vendorName}</span>
                </span>
                <Badge variant="outline" className="text-[9px] uppercase font-semibold tracking-wider">
                    {quote.status === "pending" ? "Custom Offer" : quote.status}
                </Badge>
            </div>

            <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                    {/* Category & Title */}
                    <div className="space-y-1">
                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold capitalize">
                            {formatCategoryDisplayName(quote.packagingType || "custom")}
                        </Badge>
                        <h3
                            className="font-heading text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1"
                            title={quote.requirementTitle}
                        >
                            {quote.requirementTitle}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            Custom manufacturer quotation submitted for your packaging requirement.
                        </p>
                    </div>

                    {/* Economics Display Box */}
                    <div className="rounded-xl bg-muted/50 p-3.5 space-y-2 border">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Quoted Unit Price</span>
                            <span className="text-lg font-black text-foreground">
                                ₹{unitPriceNum > 0 ? unitPriceNum.toFixed(2) : "0.00"}
                                <span className="text-xs font-normal text-muted-foreground"> / unit</span>
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                            <span>Quoted Quantity</span>
                            <span className="font-semibold text-foreground">
                                {quote.quantity.toLocaleString()} units
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                            <span className="font-medium text-foreground">Total Order Amount</span>
                            <span className="font-bold text-primary text-sm">
                                ₹{totalPriceNum.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Delivery & Logistics info */}
                    <div className="space-y-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-muted-foreground shrink-0" />
                            <span>
                                Production: <strong>{quote.productionTime}</strong> · Delivery:{" "}
                                <strong>{quote.deliveryEstimate}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span>
                                Vendor Location: <strong>{quote.vendorLocation}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                            <span>Payments are arranged offline in this prototype</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-border/50">
                    <Button
                        type="button"
                        disabled={quote.status !== "pending" || isProcessing}
                        className="w-full text-xs font-semibold h-9 shadow-xs"
                        onClick={onAccept}
                    >
                        {isProcessing
                            ? "Creating order..."
                            : quote.status === "pending"
                            ? "Accept & create order"
                            : "Offer processed"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

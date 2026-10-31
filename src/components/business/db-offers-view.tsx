"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    createOrderFromOfferingAction,
    createOrderFromQuoteAction,
    type BusinessQuoteSummary,
} from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, ShoppingBag } from "lucide-react"
import {
    formatCategoryDisplayName,
    normalizeCategoryKey,
    STANDARD_OFFERING_CATEGORIES,
} from "@/lib/constants/categories"
import {
    OfferingCard,
    QuoteCard,
    type BusinessOfferingItem,
} from "@/components/business/offering-card"

export type BusinessOffering = BusinessOfferingItem

export default function DbOffersView({
    quotes,
    offerings,
    businessId,
}: {
    quotes: BusinessQuoteSummary[]
    offerings: BusinessOffering[]
    businessId: string
}) {
    const router = useRouter()
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [selectedOffering, setSelectedOffering] = useState<BusinessOffering | null>(null)
    const [quantity, setQuantity] = useState("")
    const [address, setAddress] = useState({ line1: "", city: "", state: "", pincode: "" })
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const inFlightRef = useRef(false)

    const filteredOfferings = useMemo(() => {
        return offerings.filter((o) => {
            const matchesCategory =
                categoryFilter === "all"
                    ? true
                    : normalizeCategoryKey(o.offeringType) === normalizeCategoryKey(categoryFilter)
            const searchLower = searchQuery.toLowerCase().trim()
            if (!searchLower) return matchesCategory

            const matchesSearch =
                o.title.toLowerCase().includes(searchLower) ||
                o.offeringType.toLowerCase().includes(searchLower) ||
                formatCategoryDisplayName(o.offeringType).toLowerCase().includes(searchLower) ||
                o.city.toLowerCase().includes(searchLower) ||
                (o.vendorName && o.vendorName.toLowerCase().includes(searchLower))

            return matchesCategory && matchesSearch
        })
    }, [offerings, categoryFilter, searchQuery])

    async function acceptQuote(quote: BusinessQuoteSummary) {
        if (inFlightRef.current) return
        inFlightRef.current = true
        setPendingId(quote.id)
        try {
            const result = await createOrderFromQuoteAction({
                quoteId: quote.id,
                businessId,
                idempotencyKey: crypto.randomUUID(),
                vendorId: quote.vendorId,
                totalAmount: Number(quote.totalPrice),
                items: [
                    {
                        title: quote.requirementTitle,
                        quantity: quote.quantity,
                    },
                ],
                shippingAddress: {
                    line1: quote.deliveryLocation,
                    city: quote.deliveryLocation.slice(0, 120),
                    state: "India",
                    pincode: "000000",
                    country: "India",
                },
            })

            if (!result.success) {
                toast.error("Couldn't create order")
                return
            }

            toast.success("Order placed")
            router.push("/business/orders")
            router.refresh()
        } catch {
            toast.error("Couldn't create order", { description: "Try again." })
        } finally {
            inFlightRef.current = false
            setPendingId(null)
        }
    }

    async function placeOfferingOrder() {
        if (!selectedOffering) return
        const parsedQuantity = Number(quantity)
        if (
            !Number.isInteger(parsedQuantity) ||
            parsedQuantity <= 0 ||
            !address.line1 ||
            !address.city ||
            !address.state ||
            !address.pincode
        ) {
            toast.error("Enter a valid quantity and complete shipping address.")
            return
        }
        setPendingId(selectedOffering.id)
        try {
            const result = await createOrderFromOfferingAction({
                offeringId: selectedOffering.id,
                businessId,
                quantity: parsedQuantity,
                shippingAddress: { ...address, country: "India" },
                idempotencyKey: crypto.randomUUID(),
            })
            if (!result.success) {
                toast.error("Couldn't place order")
                return
            }
            toast.success("Order placed")
            setSelectedOffering(null)
            router.push("/business/orders")
            router.refresh()
        } catch {
            toast.error("Couldn't place order", { description: "Try again." })
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
            <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                    Vendor Offers & Catalog
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Review incoming vendor quotations for your packaging requirements and browse live catalog offerings from verified manufacturers.
                </p>
            </div>

            {/* SECTION 1: CUSTOM QUOTATIONS FOR SUBMITTED REQUIREMENTS */}
            {quotes.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">
                                Received Quotations ({quotes.length})
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Direct offers received from suppliers for your posted packaging requirements.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {quotes.map((quote) => (
                            <QuoteCard
                                key={quote.id}
                                quote={quote}
                                onAccept={() => acceptQuote(quote)}
                                isProcessing={pendingId === quote.id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* SECTION 2: LIVE CATALOG OFFERINGS FROM MANUFACTURERS */}
            <section className="space-y-4">
                <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Available Vendor Offerings
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Verified packaging offerings ready for direct procurement.
                        </p>
                    </div>

                    {/* Filters & Search Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 text-xs h-9 bg-card"
                            />
                        </div>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-48 text-xs h-9 bg-card">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {STANDARD_OFFERING_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.key} value={cat.key}>
                                        {cat.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {filteredOfferings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center text-muted-foreground bg-card">
                        <p className="text-sm font-semibold text-foreground">
                            No offerings match your search criteria
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your filters or search keywords.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {filteredOfferings.map((offering) => (
                            <OfferingCard
                                key={offering.id}
                                offering={offering}
                                onSelect={(item) => {
                                    setSelectedOffering(item)
                                    setQuantity(String(item.minOrderQuantity))
                                }}
                                disabled={pendingId === offering.id}
                            />
                        ))}
                    </div>
                )}
            </section>

            {quotes.length === 0 && offerings.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                        No active vendor offerings or quotes are available yet.
                    </CardContent>
                </Card>
            )}

            {/* ORDER PLACEMENT MODAL */}
            <Dialog open={selectedOffering !== null} onOpenChange={(open) => !open && setSelectedOffering(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <ShoppingBag className="size-4 text-primary" />
                            <span>Place Direct Order</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {selectedOffering?.title} · {selectedOffering?.vendorName ?? "Verified Manufacturer"}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOffering && (
                        <div className="space-y-4 pt-2">
                            <div className="rounded-lg bg-muted/50 p-3 border text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Wholesale Unit Price:</span>
                                    <span className="font-semibold text-foreground">
                                        ₹{parseFloat(String(selectedOffering.unitPrice)).toFixed(2)} / {selectedOffering.unitOfMeasure}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Minimum Order Quantity:</span>
                                    <span className="font-semibold text-foreground">
                                        {selectedOffering.minOrderQuantity.toLocaleString()} {selectedOffering.unitOfMeasure}s
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lead Time:</span>
                                    <span className="font-semibold text-foreground">
                                        {selectedOffering.leadTimeDaysMin}-{selectedOffering.leadTimeDaysMax} days
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="offering-quantity" className="text-xs font-semibold">
                                    Order Batch Quantity ({selectedOffering.unitOfMeasure}s){" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="offering-quantity"
                                    type="number"
                                    min={selectedOffering.minOrderQuantity}
                                    step={selectedOffering.quantityStep || 1}
                                    value={quantity}
                                    onChange={(event) => setQuantity(event.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">
                                    Delivery Address <span className="text-destructive">*</span>
                                </Label>
                                <div className="grid gap-2">
                                    <Input
                                        value={address.line1}
                                        onChange={(event) => setAddress({ ...address, line1: event.target.value })}
                                        placeholder="Street address / facility"
                                        className="h-9 text-xs"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input
                                            value={address.city}
                                            onChange={(event) => setAddress({ ...address, city: event.target.value })}
                                            placeholder="City"
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            value={address.state}
                                            onChange={(event) => setAddress({ ...address, state: event.target.value })}
                                            placeholder="State"
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            value={address.pincode}
                                            onChange={(event) => setAddress({ ...address, pincode: event.target.value })}
                                            placeholder="PIN Code"
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-primary/5 p-3 border border-primary/20 flex items-center justify-between">
                                <span className="text-xs font-medium text-foreground">Estimated Order Total:</span>
                                <span className="text-base font-extrabold text-primary">
                                    ₹{(parseFloat(String(selectedOffering.unitPrice)) * (Number(quantity) || 0)).toLocaleString("en-IN", {
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-3">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOffering(null)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={pendingId === selectedOffering?.id}
                            onClick={placeOfferingOrder}
                            className="font-bold text-xs shadow-xs"
                        >
                            {pendingId === selectedOffering?.id ? "Placing order..." : "Place order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

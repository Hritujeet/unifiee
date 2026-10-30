"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createOrderFromOfferingAction, createOrderFromQuoteAction, type BusinessQuoteSummary } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type BusinessOffering = {
    id: string
    title: string
    description: string
    offeringType: string
    unitPrice: string
    unitOfMeasure: string
    minOrderQuantity: number
    quantityStep: number
    leadTimeDaysMin: number
    leadTimeDaysMax: number
    city: string
    state: string
    vendorName: string | null
}

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
    const inFlightRef = useRef(false)

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
                items: [{
                    title: quote.requirementTitle,
                    quantity: quote.quantity,
                }],
                shippingAddress: {
                    line1: quote.deliveryLocation,
                    city: quote.deliveryLocation.slice(0, 120),
                    state: "India",
                    pincode: "000000",
                    country: "India",
                },
            })

            if (!result.success) {
                toast.error(result.error ?? "Could not create the order.")
                return
            }

            toast.success(`Order ${result.data?.orderNumber} created.`)
            router.push("/business/orders")
            router.refresh()
        } catch {
            toast.error("Could not create the order. Please try again.")
        } finally {
            inFlightRef.current = false
            setPendingId(null)
        }
    }

    async function placeOfferingOrder() {
        if (!selectedOffering) return
        const parsedQuantity = Number(quantity)
        if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0 || !address.line1 || !address.city || !address.state || !address.pincode) {
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
                toast.error(result.error ?? "Could not place the order.")
                return
            }
            toast.success(`Order ${result.data?.orderNumber} created.`)
            setSelectedOffering(null)
            router.push("/business/orders")
            router.refresh()
        } catch {
            toast.error("Could not place the order. Please try again.")
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">Offers</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Review vendor offers and convert an accepted offer into a database-backed order.
                </p>
            </div>
            {quotes.length > 0 && (
                <div className="grid gap-4">
                    {quotes.map((quote) => (
                        <Card key={quote.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base">{quote.requirementTitle}</CardTitle>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {quote.vendorName} · {quote.vendorLocation} · {quote.quantity} units
                                    </p>
                                </div>
                                <Badge variant="secondary">{quote.status}</Badge>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm">
                                    <p className="font-semibold">₹{Number(quote.totalPrice).toLocaleString("en-IN")}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Production: {quote.productionTime} · Delivery: {quote.deliveryEstimate}
                                    </p>
                                </div>
                                <Button
                                    disabled={quote.status !== "pending" || pendingId !== null}
                                    aria-busy={pendingId === quote.id}
                                    aria-disabled={pendingId === quote.id}
                                    onClick={() => acceptQuote(quote)}
                                >
                                    {pendingId === quote.id ? "Creating order..." : quote.status === "pending" ? "Accept & create order" : "Offer processed"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            {offerings.length > 0 && (
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Available vendor offerings</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Active catalog offerings currently available from manufacturers.</p>
                    </div>
                    <div className="grid gap-4">
                        {offerings.map((offering) => (
                            <Card key={offering.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{offering.title}</CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        {offering.vendorName ?? "Manufacturer"} · {offering.city}, {offering.state}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <p className="text-muted-foreground">{offering.description}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span>₹{Number(offering.unitPrice).toLocaleString("en-IN")} / {offering.unitOfMeasure}</span>
                                        <span>MOQ: {offering.minOrderQuantity.toLocaleString("en-IN")}</span>
                                        <span>Lead time: {offering.leadTimeDaysMin}–{offering.leadTimeDaysMax} days</span>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setSelectedOffering(offering)
                                            setQuantity(String(offering.minOrderQuantity))
                                        }}
                                    >
                                        View details & place order
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
            {quotes.length === 0 && offerings.length === 0 && (
                <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No active vendor offerings or quotes are available yet.</CardContent></Card>
            )}
            <Dialog open={selectedOffering !== null} onOpenChange={(open) => !open && setSelectedOffering(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedOffering?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedOffering?.vendorName ?? "Manufacturer"} · {selectedOffering?.city}, {selectedOffering?.state}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOffering && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">{selectedOffering.description}</p>
                            <div className="grid gap-2">
                                <Label htmlFor="offering-quantity">Quantity ({selectedOffering.unitOfMeasure})</Label>
                                <Input id="offering-quantity" type="number" min={selectedOffering.minOrderQuantity} step={selectedOffering.quantityStep} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="shipping-line1">Address</Label>
                                    <Input id="shipping-line1" value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} placeholder="Address line" />
                                </div>
                                <Input value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} placeholder="City" />
                                <Input value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} placeholder="State" />
                                <Input value={address.pincode} onChange={(event) => setAddress({ ...address, pincode: event.target.value })} placeholder="PIN code" />
                            </div>
                            <p className="text-sm font-semibold">Estimated total: ₹{(Number(selectedOffering.unitPrice) * (Number(quantity) || 0)).toLocaleString("en-IN")}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedOffering(null)}>Cancel</Button>
                        <Button disabled={pendingId === selectedOffering?.id} onClick={placeOfferingOrder}>
                            {pendingId === selectedOffering?.id ? "Placing order..." : "Place order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

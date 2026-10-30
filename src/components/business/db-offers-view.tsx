"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createOrderFromQuoteAction, type BusinessQuoteSummary } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function DbOffersView({
    quotes,
    businessId,
}: {
    quotes: BusinessQuoteSummary[]
    businessId: string
}) {
    const router = useRouter()
    const [pendingId, setPendingId] = useState<string | null>(null)
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

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">Offers</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Review vendor offers and convert an accepted offer into a database-backed order.
                </p>
            </div>
            {quotes.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No vendor offers are available yet.</CardContent></Card>
            ) : (
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
        </div>
    )
}

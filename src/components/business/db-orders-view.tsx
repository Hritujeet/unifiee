"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { cancelOrderAction, type BusinessOrderSummary } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStepper } from "@/components/orders/order-stepper"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { ShipmentCard } from "@/components/orders/shipment-card"

export default function DbOrdersView({ orders }: { orders: BusinessOrderSummary[] }) {
    const router = useRouter()
    const [pendingId, setPendingId] = useState<string | null>(null)
    const inFlightRef = useRef(false)

    async function cancelOrder(orderId: string) {
        const reason = window.prompt("Why are you cancelling this order?")
        if (!reason?.trim()) return

        if (inFlightRef.current) return
        inFlightRef.current = true
        setPendingId(orderId)
        try {
            const result = await cancelOrderAction({ orderId, role: "business", reason, idempotencyKey: crypto.randomUUID() })
            if (!result.success) {
                toast.error(result.error ?? "Could not cancel the order.")
                return
            }
            toast.success("Order cancelled.")
            router.refresh()
        } catch {
            toast.error("Could not cancel the order. Please try again.")
        } finally {
            inFlightRef.current = false
            setPendingId(null)
        }
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">Orders</h1>
                <p className="mt-2 text-sm text-muted-foreground">Track your orders from confirmation through delivery.</p>
            </div>
            {orders.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No database-backed orders yet. Accept a vendor offer to create one.</CardContent></Card>
            ) : (
                <div className="grid gap-4">
                    {orders.map(({ order, vendorName, milestones, shipment }) => {
                        const canCancel = ["placed", "confirmed", "proof_pending", "proof_approved"].includes(order.status)
                        return (
                            <Card key={order.id}>
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Vendor: {vendorName} · Total: ₹{Number(order.total).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <OrderStatusBadge status={order.status} />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <OrderStepper status={order.status} />
                                    <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                                        <div>
                                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h3>
                                            <OrderTimeline milestones={milestones} />
                                        </div>
                                        <div>
                                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shipment</h3>
                                            <ShipmentCard shipment={shipment} />
                                        </div>
                                    </div>
                                    {order.cancellationReason && (
                                        <p className="text-xs text-destructive">Cancellation reason: {order.cancellationReason}</p>
                                    )}
                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pendingId !== null}
                                            aria-busy={pendingId === order.id}
                                            aria-disabled={pendingId === order.id}
                                            onClick={() => cancelOrder(order.id)}
                                        >
                                            {pendingId === order.id ? "Cancelling..." : "Cancel order"}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

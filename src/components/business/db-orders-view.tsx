"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cancelOrderAction, type BusinessOrderSummary } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStepper } from "@/components/orders/order-stepper"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { ShipmentCard } from "@/components/orders/shipment-card"
import { Loader2, Package } from "lucide-react"

export default function DbOrdersView({ orders }: { orders: BusinessOrderSummary[] }) {
    const router = useRouter()
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
    const [cancelReason, setCancelReason] = useState("")
    const inFlightRef = useRef(false)

    async function handleConfirmCancel() {
        if (!orderToCancel || !cancelReason.trim()) return

        if (inFlightRef.current) return
        inFlightRef.current = true
        setPendingId(orderToCancel)
        try {
            const result = await cancelOrderAction({
                orderId: orderToCancel,
                role: "business",
                reason: cancelReason.trim(),
                idempotencyKey: crypto.randomUUID(),
            })
            if (!result.success) {
                toast.error("Couldn't cancel order")
                return
            }
            toast.success("Order cancelled")
            setOrderToCancel(null)
            setCancelReason("")
            router.refresh()
        } catch {
            toast.error("Couldn't cancel order", { description: "Try again." })
        } finally {
            inFlightRef.current = false
            setPendingId(null)
        }
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Orders</h1>
                <p className="mt-1 text-sm text-muted-foreground">Track your orders from confirmation through delivery.</p>
            </div>
            {orders.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Package className="size-10 text-muted-foreground/50 mb-3" />
                        <h3 className="text-base font-semibold text-foreground">No orders placed yet</h3>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            Once you accept a vendor offer or complete an order checkout, you can track production, proofs, and shipments here.
                        </p>
                        <Button asChild size="sm" className="mt-5 text-xs">
                            <Link href="/business/offers">Browse vendor offers</Link>
                        </Button>
                    </CardContent>
                </Card>
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
                                            onClick={() => {
                                                setOrderToCancel(order.id)
                                                setCancelReason("")
                                            }}
                                            className="text-xs"
                                        >
                                            {pendingId === order.id ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                    <span>Cancelling...</span>
                                                </span>
                                            ) : (
                                                "Cancel order"
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Cancel Order Dialog */}
            <Dialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cancel order</DialogTitle>
                        <DialogDescription>
                            Please state the reason for cancelling this order. The vendor will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="cancel-reason" className="text-xs text-muted-foreground">Reason</Label>
                        <Textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g., Change in packaging specification or timeline"
                            rows={3}
                            className="text-xs resize-none"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrderToCancel(null)}
                            disabled={pendingId !== null}
                        >
                            Back
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={!cancelReason.trim() || pendingId !== null}
                            onClick={handleConfirmCancel}
                        >
                            {pendingId ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

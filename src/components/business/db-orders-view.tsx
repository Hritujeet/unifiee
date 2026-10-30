"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cancelOrderAction, type BusinessOrderSummary } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const statusLabels: Record<string, string> = {
    submitted: "Request received",
    confirmed: "Confirmed",
    processing: "In production",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
}

export default function DbOrdersView({ orders }: { orders: BusinessOrderSummary[] }) {
    const router = useRouter()
    const [pendingId, setPendingId] = useState<string | null>(null)

    async function cancelOrder(orderId: string) {
        const reason = window.prompt("Why are you cancelling this order?")
        if (!reason?.trim()) return

        setPendingId(orderId)
        try {
            const result = await cancelOrderAction({ orderId, role: "business", reason })
            if (!result.success) {
                toast.error(result.error ?? "Could not cancel the order.")
                return
            }
            toast.success("Order cancelled.")
            router.refresh()
        } catch {
            toast.error("Could not cancel the order. Please try again.")
        } finally {
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
                    {orders.map(({ order, vendorName, milestones }) => {
                        const canCancel = ["draft", "submitted", "confirmed"].includes(order.status)
                        return (
                            <Card key={order.id}>
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Vendor: {vendorName} · Total: ₹{Number(order.total).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"}>
                                        {statusLabels[order.status] ?? order.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {milestones.map((milestone) => (
                                            <span key={milestone.id} className="rounded-full border px-2.5 py-1">
                                                {milestone.title}
                                            </span>
                                        ))}
                                    </div>
                                    {order.cancellationReason && (
                                        <p className="text-xs text-destructive">Cancellation reason: {order.cancellationReason}</p>
                                    )}
                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pendingId !== null}
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

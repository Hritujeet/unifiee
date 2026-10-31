"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { confirmOrderAction, dispatchOrderAction, markDeliveredAction, markQualityCheckAction, startProductionAction, uploadProofAction } from "@/actions/vendor-actions"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStepper } from "@/components/orders/order-stepper"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { ShipmentCard } from "@/components/orders/shipment-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrderStatus } from "@/lib/orders/lifecycle"

type Detail = NonNullable<Awaited<ReturnType<typeof import("@/actions/vendor-actions").getVendorOrderDetail>>["data"]>

export default function VendorOrderDetailView({ detail }: { detail: Detail }) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)
    const order = detail.order
    async function run(action: () => Promise<{ success: boolean; error?: string }>) {
        setBusy(true)
        const result = await action()
        setBusy(false)
        if (!result.success) toast.error("Couldn't save order")
        else {
            toast.success("Order saved")
            router.refresh()
        }
    }
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">Vendor order</p>
                    <h1 className="font-heading text-2xl font-semibold">{order.orderNumber}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Buyer: {detail.buyerName ?? "Hidden until confirmation"}</p>
                </div>
                <OrderStatusBadge status={order.status as OrderStatus} />
            </header>
            <Card><CardContent className="p-5"><OrderStepper status={order.status as OrderStatus} /></CardContent></Card>
            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Order summary</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {detail.items.map((item) => <div key={item.id} className="flex justify-between gap-3 border-b pb-2"><span>{item.titleSnapshot} × {item.quantity}</span><span>₹{Number(item.unitPriceSnapshot).toLocaleString("en-IN")}</span></div>)}
                        <p className="font-semibold">Total: ₹{Number(order.total).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground">Payments not connected yet; payment is arranged offline.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Shipment</CardTitle></CardHeader>
                    <CardContent><ShipmentCard shipment={detail.shipment} /></CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
                <CardContent><OrderTimeline milestones={detail.milestones} /></CardContent>
            </Card>
            <div className="flex flex-wrap gap-2">
                {order.status === "placed" && <Button disabled={busy} onClick={() => run(() => confirmOrderAction(order.id, crypto.randomUUID()))}>Confirm order</Button>}
                {order.status === "confirmed" && <Button disabled={busy} onClick={() => {
                    const fileUrl = window.prompt("Paste the HTTPS proof URL")
                    return fileUrl ? run(() => uploadProofAction({ orderId: order.id, fileUrl, idempotencyKey: crypto.randomUUID() })) : undefined
                }}>Upload proof</Button>}
                {order.status === "proof_approved" && <Button disabled={busy} onClick={() => run(() => startProductionAction(order.id, crypto.randomUUID()))}>Start production</Button>}
                {order.status === "in_production" && <Button disabled={busy} onClick={() => run(() => markQualityCheckAction(order.id, "Quality check completed.", crypto.randomUUID()))}>Pass quality check</Button>}
                {order.status === "quality_check" && <Button disabled={busy} onClick={() => {
                    const courier = window.prompt("Courier partner")
                    const trackingNumber = courier && window.prompt("Tracking number")
                    const eta = trackingNumber && window.prompt("Estimated delivery date (YYYY-MM-DD)")
                    return courier && trackingNumber && eta ? run(() => dispatchOrderAction({ orderId: order.id, courier, trackingNumber, eta, idempotencyKey: crypto.randomUUID() })) : undefined
                }}>Dispatch order</Button>}
                {order.status === "dispatched" && <Button disabled={busy} onClick={() => run(() => markDeliveredAction(order.id, crypto.randomUUID()))}>Mark delivered</Button>}
            </div>
        </div>
    )
}

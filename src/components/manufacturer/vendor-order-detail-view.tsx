"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    confirmOrderAction,
    dispatchOrderAction,
    markDeliveredAction,
    markQualityCheckAction,
    startProductionAction,
    uploadProofAction,
} from "@/actions/vendor-actions"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStepper } from "@/components/orders/order-stepper"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { ShipmentCard } from "@/components/orders/shipment-card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { OrderStatus } from "@/lib/orders/lifecycle"

type Detail = NonNullable<Awaited<ReturnType<typeof import("@/actions/vendor-actions").getVendorOrderDetail>>["data"]>

export default function VendorOrderDetailView({ detail }: { detail: Detail }) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)
    const [proofOpen, setProofOpen] = useState(false)
    const [proofUrl, setProofUrl] = useState("")
    const [dispatchOpen, setDispatchOpen] = useState(false)
    const [courier, setCourier] = useState("")
    const [trackingNumber, setTrackingNumber] = useState("")
    const [eta, setEta] = useState("")

    const order = detail.order

    async function run(action: () => Promise<{ success: boolean; error?: string }>) {
        setBusy(true)
        const result = await action()
        setBusy(false)
        if (!result.success) {
            toast.error("Couldn't save order")
        } else {
            toast.success("Order saved")
            router.refresh()
        }
    }

    const handleUploadProof = async () => {
        if (!proofUrl.trim()) return
        await run(() => uploadProofAction({ orderId: order.id, fileUrl: proofUrl.trim(), idempotencyKey: crypto.randomUUID() }))
        setProofOpen(false)
        setProofUrl("")
    }

    const handleDispatchOrder = async () => {
        if (!courier.trim() || !trackingNumber.trim() || !eta.trim()) return
        await run(() => dispatchOrderAction({
            orderId: order.id,
            courier: courier.trim(),
            trackingNumber: trackingNumber.trim(),
            eta: eta.trim(),
            idempotencyKey: crypto.randomUUID(),
        }))
        setDispatchOpen(false)
        setCourier("")
        setTrackingNumber("")
        setEta("")
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">Vendor order</p>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Buyer: {detail.buyerName ?? "Hidden until confirmation"}</p>
                </div>
                <OrderStatusBadge status={order.status as OrderStatus} />
            </header>

            <Card>
                <CardContent className="p-5">
                    <OrderStepper status={order.status as OrderStatus} />
                </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Order summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {detail.items.map((item) => (
                            <div key={item.id} className="flex justify-between gap-3 border-b pb-2">
                                <span>{item.titleSnapshot} × {item.quantity}</span>
                                <span className="font-medium">₹{Number(item.unitPriceSnapshot).toLocaleString("en-IN")}</span>
                            </div>
                        ))}
                        <p className="font-semibold text-foreground pt-1">Total: ₹{Number(order.total).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground">Payments not connected yet; payment is arranged offline.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Shipment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ShipmentCard shipment={detail.shipment} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <OrderTimeline milestones={detail.milestones} />
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-2 pt-2">
                {order.status === "placed" && (
                    <Button disabled={busy} onClick={() => run(() => confirmOrderAction(order.id, crypto.randomUUID()))} className="text-xs">
                        {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                        Confirm order
                    </Button>
                )}
                {order.status === "confirmed" && (
                    <Button disabled={busy} onClick={() => { setProofUrl(""); setProofOpen(true); }} className="text-xs">
                        Upload artwork proof
                    </Button>
                )}
                {order.status === "proof_approved" && (
                    <Button disabled={busy} onClick={() => run(() => startProductionAction(order.id, crypto.randomUUID()))} className="text-xs">
                        {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                        Start production
                    </Button>
                )}
                {order.status === "in_production" && (
                    <Button disabled={busy} onClick={() => run(() => markQualityCheckAction(order.id, "Quality check completed.", crypto.randomUUID()))} className="text-xs">
                        {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                        Pass quality check
                    </Button>
                )}
                {order.status === "quality_check" && (
                    <Button disabled={busy} onClick={() => { setCourier(""); setTrackingNumber(""); setEta(""); setDispatchOpen(true); }} className="text-xs">
                        Dispatch order
                    </Button>
                )}
                {order.status === "dispatched" && (
                    <Button disabled={busy} onClick={() => run(() => markDeliveredAction(order.id, crypto.randomUUID()))} className="text-xs">
                        {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                        Mark delivered
                    </Button>
                )}
            </div>

            {/* Proof Upload Dialog */}
            <Dialog open={proofOpen} onOpenChange={setProofOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Artwork Proof</DialogTitle>
                        <DialogDescription>
                            Enter the secure HTTPS link to the artwork proof for buyer review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="proof-detail-url" className="text-xs text-muted-foreground">Proof URL (HTTPS)</Label>
                        <Input
                            id="proof-detail-url"
                            type="url"
                            placeholder="https://..."
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setProofOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!proofUrl.trim().startsWith("http") || busy}
                            onClick={handleUploadProof}
                        >
                            {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Upload Proof"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dispatch Dialog */}
            <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Dispatch & Shipment Details</DialogTitle>
                        <DialogDescription>
                            Provide courier and tracking information for the buyer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="detail-courier" className="text-xs text-muted-foreground">Courier Partner</Label>
                            <Input
                                id="detail-courier"
                                placeholder="e.g., Blue Dart, Delhivery"
                                value={courier}
                                onChange={(e) => setCourier(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="detail-tracking" className="text-xs text-muted-foreground">Tracking Number</Label>
                            <Input
                                id="detail-tracking"
                                placeholder="e.g., AWB12345678"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="detail-eta" className="text-xs text-muted-foreground">Estimated Delivery Date</Label>
                            <Input
                                id="detail-eta"
                                type="date"
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDispatchOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!courier.trim() || !trackingNumber.trim() || !eta.trim() || busy}
                            onClick={handleDispatchOrder}
                        >
                            {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Dispatch Order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

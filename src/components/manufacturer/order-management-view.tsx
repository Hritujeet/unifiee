"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
    confirmOrderAction,
    dispatchOrderAction,
    markDeliveredAction,
    markQualityCheckAction,
    startProductionAction,
    uploadProofAction,
} from "@/actions/vendor-actions"
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/lifecycle"
import {
    ShoppingCart,
    Package,
    Search,
    MapPin,
    CheckCircle2,
    Truck,
    Plus,
    ShieldCheck,
    Check,
    Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface OrderItemSnapshot {
    id: string
    orderId: string
    offeringId: string | null
    status: string
    titleSnapshot: string
    quantity: number
    unitOfMeasureSnapshot: string
    unitPriceSnapshot: string
    taxPercentSnapshot: string
    priceIncludesTaxSnapshot: boolean
    fulfilmentModeSnapshot: string
    leadTimeDaysMinSnapshot: number
    leadTimeDaysMaxSnapshot: number
    shippingTermsSnapshot: string
    hsnSacCodeSnapshot: string | null
    imageUrlSnapshot: string | null
    createdAt: Date
}

export interface DbOrderWithItems {
    order: {
        id: string
        orderNumber: string
        status: string
        subtotal: string
        taxTotal: string
        shippingTotal: string
        total: string
        paymentTerms: string
        notes?: string | null
        shippingAddressLine1: string
        shippingAddressLine2?: string | null
        shippingCity: string
        shippingDistrict?: string | null
        shippingState: string
        shippingPincode: string
        shippingCountry?: string
        createdAt: Date
        submittedAt?: Date
        deliveredAt?: Date | null
    }
    buyerName: string | null
    buyerEmail: string | null
    buyerPhone: string | null
    items?: OrderItemSnapshot[]
}

interface OrderManagementViewProps {
    initialOrders: DbOrderWithItems[]
}

const LIFECYCLE_STEPS = [
    { key: "placed", label: "Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "proof_pending", label: "Proof" },
    { key: "proof_approved", label: "Proof approved" },
    { key: "in_production", label: "Production" },
    { key: "quality_check", label: "Quality check" },
    { key: "dispatched", label: "Dispatched" },
    { key: "delivered", label: "Delivered" },
]

function getStageIndex(status: string): number {
    switch (status) {
        case "placed": return 0
        case "confirmed": return 1
        case "proof_pending": return 2
        case "proof_approved": return 3
        case "in_production": return 4
        case "quality_check": return 5
        case "dispatched": return 6
        case "delivered": return 7
        default: return 0
    }
}

export function OrderManagementView({ initialOrders }: OrderManagementViewProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<DbOrderWithItems[]>(initialOrders)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [proofOrderId, setProofOrderId] = useState<string | null>(null)
    const [proofUrl, setProofUrl] = useState("")
    const [dispatchOrderId, setDispatchOrderId] = useState<string | null>(null)
    const [courier, setCourier] = useState("")
    const [trackingNumber, setTrackingNumber] = useState("")
    const [eta, setEta] = useState("")
    const handleUploadProof = async () => {
        if (!proofOrderId || !proofUrl.trim()) return
        setUpdatingId(proofOrderId)
        try {
            const result = await uploadProofAction({ orderId: proofOrderId, fileUrl: proofUrl.trim(), idempotencyKey: crypto.randomUUID() })
            if (result.success) {
                toast.success("Proof uploaded")
                setProofOrderId(null)
                setProofUrl("")
                router.refresh()
            } else {
                toast.error("Couldn't upload proof")
            }
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDispatchOrder = async () => {
        if (!dispatchOrderId || !courier.trim() || !trackingNumber.trim() || !eta.trim()) return
        setUpdatingId(dispatchOrderId)
        try {
            const result = await dispatchOrderAction({
                orderId: dispatchOrderId,
                courier: courier.trim(),
                trackingNumber: trackingNumber.trim(),
                eta: eta.trim(),
                idempotencyKey: crypto.randomUUID(),
            })
            if (result.success) {
                toast.success("Shipment added")
                setDispatchOrderId(null)
                setCourier("")
                setTrackingNumber("")
                setEta("")
                router.refresh()
            } else {
                toast.error("Couldn't save shipment")
            }
        } finally {
            setUpdatingId(null)
        }
    }
    const inFlightRef = useRef(false)

    const filtered = orders.filter((item) => {
        const matchesStatus = statusFilter === "all" ? true : item.order.status === statusFilter
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
            item.order.orderNumber.toLowerCase().includes(searchLower) ||
            (item.buyerName && item.buyerName.toLowerCase().includes(searchLower)) ||
            item.order.shippingCity.toLowerCase().includes(searchLower) ||
            (item.items && item.items.some((it) => it.titleSnapshot.toLowerCase().includes(searchLower)))
        return matchesStatus && matchesSearch
    })

    const handleUpdateStatus = async (
        orderId: string,
        newStatus: "confirmed" | "in_production" | "delivered"
    ) => {
        if (inFlightRef.current) return
        inFlightRef.current = true
        setUpdatingId(orderId)
        try {
            const res = newStatus === "confirmed"
                ? await confirmOrderAction(orderId, crypto.randomUUID())
                : newStatus === "in_production"
                    ? await startProductionAction(orderId, crypto.randomUUID())
                    : await markDeliveredAction(orderId, crypto.randomUUID())
            if (res.success) {
                setOrders((prev) =>
                    prev.map((o) =>
                        o.order.id === orderId ? { ...o, order: { ...o.order, status: newStatus } } : o
                    )
                )
                toast.success("Status saved")
                router.refresh()
            } else {
                toast.error("Couldn't save status")
            }
        } finally {
            inFlightRef.current = false
            setUpdatingId(null)
        }
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center bg-card shadow-xs">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <ShoppingCart className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No orders received yet</h3>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
                    When F&B brands and restaurants place packaging orders for your catalog offerings, they will appear here for you to accept, produce, and dispatch.
                </p>
                <Button asChild size="default" className="gap-2 text-xs shadow-xs">
                    <Link href="/manufacturer/publish-offering">
                        <Plus className="size-4" />
                        List Packaging Offerings
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filter toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Order #, Buyer, or Offering..."
                        className="pl-9 text-xs h-9 bg-card"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44 text-xs h-9 bg-card">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders ({orders.length})</SelectItem>
                            <SelectItem value="placed">New Requests</SelectItem>
                            <SelectItem value="confirmed">Confirmed / Accepted</SelectItem>
                            <SelectItem value="proof_pending">Awaiting proof review</SelectItem>
                            <SelectItem value="in_production">In Production</SelectItem>
                            <SelectItem value="quality_check">Ready for dispatch</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders list */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center text-muted-foreground bg-card">
                    <p className="text-sm font-semibold text-foreground">No orders match your filter</p>
                    <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or status filter.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {filtered.map(({ order, buyerName, buyerEmail, buyerPhone, items = [] }) => {
                        const isUpdating = updatingId === order.id
                        const currentStageIndex = getStageIndex(order.status)

                        return (
                            <Card key={order.id} className="border shadow-xs hover:border-primary/40 transition-all hover:shadow-sm overflow-hidden bg-card">
                                <CardContent className="p-5 space-y-4">
                                    {/* Order Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-3.5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className="font-mono text-base font-extrabold text-foreground">
                                                    {order.orderNumber}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        order.status === "delivered"
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold uppercase"
                                                            :                                                             order.status === "dispatched"
                                                            ? "bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-bold uppercase"
                                                            : order.status === "in_production" || order.status === "quality_check"
                                                            ? "bg-primary/10 text-primary border-primary/30 text-[10px] font-bold uppercase"
                                                            : order.status === "confirmed"
                                                            ? "bg-teal-500/10 text-teal-600 border-teal-500/30 text-[10px] font-bold uppercase"
                                                            : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold uppercase"
                                                    }
                                                >
                                                    {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                                <span>Buyer: <strong className="text-foreground">{buyerName || "Business Customer"}</strong></span>
                                                {buyerPhone && <span>&bull; {buyerPhone}</span>}
                                                {buyerEmail && <span>&bull; {buyerEmail}</span>}
                                                <span>&bull; Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                                            </p>
                                        </div>

                                        <div className="text-left sm:text-right">
                                            <span className="text-lg font-black text-foreground block">
                                                ₹{parseFloat(order.total).toLocaleString("en-IN")}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground capitalize">
                                                Payment: {order.paymentTerms.replace("_", " ")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Visual Fulfillment Stepper */}
                                    <div className="py-2">
                                        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground relative">
                                            {/* Progress connecting line */}
                                            <div className="absolute left-0 top-3.5 h-0.5 w-full bg-muted -z-0" />
                                            <div
                                                className="absolute left-0 top-3.5 h-0.5 bg-primary transition-all duration-300 -z-0"
                                                style={{ width: `${(currentStageIndex / (LIFECYCLE_STEPS.length - 1)) * 100}%` }}
                                            />

                                            {LIFECYCLE_STEPS.map((step, idx) => {
                                                const isCompleted = idx < currentStageIndex
                                                const isCurrent = idx === currentStageIndex
                                                return (
                                                    <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10">
                                                        <div
                                                            className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                                isCompleted
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : isCurrent
                                                                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                                                    : "bg-muted text-muted-foreground"
                                                            }`}
                                                        >
                                                            {isCompleted ? <Check className="size-3.5" /> : idx + 1}
                                                        </div>
                                                        <span
                                                            className={`text-[10px] hidden sm:block ${
                                                                isCurrent
                                                                    ? "font-bold text-foreground"
                                                                    : isCompleted
                                                                    ? "text-foreground"
                                                                    : "text-muted-foreground"
                                                            }`}
                                                        >
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Requested Offering(s) for this Order */}
                                    <div className="rounded-xl bg-muted/40 p-4 border border-border/60 space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                                <Package className="size-3.5 text-primary" />
                                                Customer Request & Offering Details
                                            </span>
                                            {items.length > 0 && (
                                                <span className="text-[11px] font-normal text-muted-foreground">
                                                    {items.length} {items.length === 1 ? "line item" : "line items"}
                                                </span>
                                            )}
                                        </div>

                                        {items.length === 0 ? (
                                            <div className="text-xs text-muted-foreground py-1">
                                                Packaging Production Run &bull; ₹{parseFloat(order.total).toLocaleString("en-IN")}
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/40">
                                                {items.map((item) => (
                                                    <div key={item.id} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                        <div className="space-y-0.5">
                                                            <p className="font-bold text-foreground text-sm">
                                                                {item.titleSnapshot}
                                                            </p>
                                                            <p className="text-muted-foreground text-[11px]">
                                                                Quantity: <strong className="text-foreground font-semibold">{item.quantity.toLocaleString("en-IN")} {item.unitOfMeasureSnapshot}</strong>
                                                                {" "}&bull; Rate: <strong className="text-foreground font-semibold">₹{parseFloat(item.unitPriceSnapshot).toLocaleString("en-IN")}</strong>
                                                                {" "}&bull; Turnaround: {item.leadTimeDaysMinSnapshot}-{item.leadTimeDaysMaxSnapshot} days
                                                                {" "}&bull; {item.fulfilmentModeSnapshot.replace("_", " ")}
                                                            </p>
                                                        </div>
                                                        <div className="text-left sm:text-right font-extrabold text-foreground text-sm">
                                                            ₹{(item.quantity * parseFloat(item.unitPriceSnapshot)).toLocaleString("en-IN")}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {order.notes && (
                                            <div className="mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">Buyer Note: </span>
                                                {order.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Shipping Address & Status Progression Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                                        <div className="text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                            <span>
                                                {order.shippingAddressLine1}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
                                            </span>
                                        </div>

                                        {/* Status Progression Workflow */}
                                        <div className="flex items-center gap-2">
                                            {order.status === "placed" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    aria-busy={isUpdating}
                                                    aria-disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(order.id, "confirmed")}
                                                    className="h-8 text-xs gap-1.5 font-semibold shadow-xs"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    Accept Customer Order
                                                </Button>
                                            )}

                                            {order.status === "confirmed" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    aria-busy={isUpdating}
                                                    aria-disabled={isUpdating}
                                                    onClick={() => { setProofOrderId(order.id); setProofUrl(""); }}
className="h-8 text-xs gap-1.5 font-medium shadow-xs"
                                                >
                                                    <Package className="size-3.5" />
                                                    Upload artwork proof
                                                </Button>
                                            )}

                                            {order.status === "proof_approved" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    aria-busy={isUpdating}
                                                    aria-disabled={isUpdating}
                                                    variant="secondary"
                                                    onClick={() => handleUpdateStatus(order.id, "in_production")}
                                                    className="h-8 text-xs gap-1.5 font-semibold border shadow-xs"
                                                >
                                                    <Truck className="size-3.5" />
                                                    Start production
                                                </Button>
                                            )}

                                            {order.status === "in_production" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={async () => {
                                                        setUpdatingId(order.id)
                                                        const result = await markQualityCheckAction(order.id, "Quality check completed.", crypto.randomUUID())
                                                        setUpdatingId(null)
                                                        if (result.success) router.refresh()
                                                        else toast.error("Couldn't complete check")
                                                    }}
                                                    variant="secondary"
                                                    className="h-8 text-xs gap-1.5 font-semibold border shadow-xs"
                                                >
                                                    <ShieldCheck className="size-3.5" />
                                                    Pass quality check
                                                </Button>
                                            )}

                                            {order.status === "quality_check" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    aria-busy={isUpdating}
                                                    aria-disabled={isUpdating}
                                                    onClick={() => { setDispatchOrderId(order.id); setCourier(""); setTrackingNumber(""); setEta(""); }}
className="h-8 text-xs gap-1.5 font-medium shadow-xs"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    Add shipment details
                                                </Button>
                                            )}

                                            {order.status === "dispatched" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(order.id, "delivered")}
                                                    className="h-8 text-xs gap-1.5 font-medium shadow-xs"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    Mark delivered
                                                </Button>
                                            )}

                                            {order.status === "delivered" && (
                                                <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30 gap-1.5 py-1 px-2.5 font-bold">
                                                    <ShieldCheck className="size-3.5" />
                                                    Awaiting buyer confirmation
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
            {/* Upload Proof Dialog */}
            <Dialog open={!!proofOrderId} onOpenChange={(open) => !open && setProofOrderId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Artwork Proof</DialogTitle>
                        <DialogDescription>
                            Enter the secure HTTPS link to the print dieline or artwork proof for buyer review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="proof-url" className="text-xs text-muted-foreground">Proof URL (HTTPS)</Label>
                        <Input
                            id="proof-url"
                            type="url"
                            placeholder="https://..."
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setProofOrderId(null)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!proofUrl.trim().startsWith("http") || updatingId !== null}
                            onClick={handleUploadProof}
                        >
                            {updatingId ? <Loader2 className="size-3.5 animate-spin" /> : "Upload Proof"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Shipment Details Dialog */}
            <Dialog open={!!dispatchOrderId} onOpenChange={(open) => !open && setDispatchOrderId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Dispatch & Shipment Details</DialogTitle>
                        <DialogDescription>
                            Provide courier and tracking information for the buyer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="courier-name" className="text-xs text-muted-foreground">Courier Partner</Label>
                            <Input
                                id="courier-name"
                                placeholder="e.g., Blue Dart, Delhivery"
                                value={courier}
                                onChange={(e) => setCourier(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tracking-num" className="text-xs text-muted-foreground">Tracking Number</Label>
                            <Input
                                id="tracking-num"
                                placeholder="e.g., AWB12345678"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="eta-date" className="text-xs text-muted-foreground">Estimated Delivery Date</Label>
                            <Input
                                id="eta-date"
                                type="date"
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDispatchOrderId(null)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!courier.trim() || !trackingNumber.trim() || !eta.trim() || updatingId !== null}
                            onClick={handleDispatchOrder}
                        >
                            {updatingId ? <Loader2 className="size-3.5 animate-spin" /> : "Save Dispatch Details"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}

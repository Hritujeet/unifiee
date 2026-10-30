"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { updateOrderStatusAction } from "@/actions/vendor-actions"
import {
    ShoppingCart,
    Package,
    Search,
    MapPin,
    Phone,
    Mail,
    CheckCircle2,
    Truck,
    Clock,
    Plus,
    Building2,
    Calendar,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
    { key: "submitted", label: "Request Received" },
    { key: "confirmed", label: "Accepted" },
    { key: "processing", label: "Production" },
    { key: "shipped", label: "Dispatched" },
    { key: "delivered", label: "Delivered" },
]

function getStageIndex(status: string): number {
    switch (status) {
        case "submitted": return 0
        case "confirmed": return 1
        case "processing": return 2
        case "shipped": return 3
        case "delivered": return 4
        default: return 0
    }
}

export function OrderManagementView({ initialOrders }: OrderManagementViewProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<DbOrderWithItems[]>(initialOrders)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
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
        newStatus: "confirmed" | "processing" | "shipped" | "delivered"
    ) => {
        if (inFlightRef.current) return
        inFlightRef.current = true
        setUpdatingId(orderId)
        try {
            const res = await updateOrderStatusAction(orderId, newStatus, crypto.randomUUID())
            if (res.success) {
                setOrders((prev) =>
                    prev.map((o) =>
                        o.order.id === orderId ? { ...o, order: { ...o.order, status: newStatus } } : o
                    )
                )
                toast.success(`Order status updated to ${newStatus}`)
                router.refresh()
            } else {
                toast.error(res.error || "Failed to update order status")
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
                            <SelectItem value="submitted">New Requests</SelectItem>
                            <SelectItem value="confirmed">Confirmed / Accepted</SelectItem>
                            <SelectItem value="processing">In Production</SelectItem>
                            <SelectItem value="shipped">Dispatched / Shipped</SelectItem>
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
                                                            : order.status === "shipped"
                                                            ? "bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-bold uppercase"
                                                            : order.status === "processing"
                                                            ? "bg-primary/10 text-primary border-primary/30 text-[10px] font-bold uppercase"
                                                            : order.status === "confirmed"
                                                            ? "bg-teal-500/10 text-teal-600 border-teal-500/30 text-[10px] font-bold uppercase"
                                                            : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold uppercase"
                                                    }
                                                >
                                                    {order.status === "submitted" ? "New Request" : order.status}
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
                                            {order.status === "submitted" && (
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
                                                    onClick={() => handleUpdateStatus(order.id, "processing")}
                                                    className="h-8 text-xs gap-1.5 font-semibold shadow-xs"
                                                >
                                                    <Package className="size-3.5" />
                                                    Start Production Batch
                                                </Button>
                                            )}

                                            {order.status === "processing" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    aria-busy={isUpdating}
                                                    aria-disabled={isUpdating}
                                                    variant="secondary"
                                                    onClick={() => handleUpdateStatus(order.id, "shipped")}
                                                    className="h-8 text-xs gap-1.5 font-semibold border shadow-xs"
                                                >
                                                    <Truck className="size-3.5" />
                                                    Mark Dispatched & In Transit
                                                </Button>
                                            )}

                                            {order.status === "shipped" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    aria-busy={isUpdating}
                                                    aria-disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(order.id, "delivered")}
                                                    className="h-8 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    Confirm Buyer Delivery
                                                </Button>
                                            )}

                                            {order.status === "delivered" && (
                                                <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30 gap-1.5 py-1 px-2.5 font-bold">
                                                    <ShieldCheck className="size-3.5" />
                                                    Fulfilled & Escrow Settled
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
        </div>
    )
}

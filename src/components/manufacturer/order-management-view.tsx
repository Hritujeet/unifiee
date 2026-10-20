"use client"

import { useState } from "react"
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

export function OrderManagementView({ initialOrders }: OrderManagementViewProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<DbOrderWithItems[]>(initialOrders)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [updatingId, setUpdatingId] = useState<string | null>(null)

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
        setUpdatingId(orderId)
        try {
            const res = await updateOrderStatusAction(orderId, newStatus)
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
            setUpdatingId(null)
        }
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <ShoppingCart className="size-6 text-muted-foreground/60" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No orders received yet</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mb-4">
                    When businesses place orders for your packaging offerings, they will appear here for you to review and fulfill.
                </p>
                <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Link href="/manufacturer/publish-offering">
                        <Plus className="size-3.5" />
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
                        className="pl-9 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 text-xs h-9">
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
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No orders match your filter</p>
                    <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or status filter.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(({ order, buyerName, buyerEmail, buyerPhone, items = [] }) => {
                        const isUpdating = updatingId === order.id
                        return (
                            <Card key={order.id} className="border shadow-xs hover:border-primary/40 transition-colors overflow-hidden">
                                <CardContent className="p-4 sm:p-5 space-y-4">
                                    {/* Order Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-sm font-bold text-foreground">
                                                    {order.orderNumber}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        order.status === "delivered"
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs uppercase"
                                                            : order.status === "shipped"
                                                            ? "bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs uppercase"
                                                            : order.status === "processing"
                                                            ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-xs uppercase"
                                                            : order.status === "confirmed"
                                                            ? "bg-teal-500/10 text-teal-600 border-teal-500/30 text-xs uppercase"
                                                            : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs uppercase"
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
                                            <span className="text-base font-bold text-foreground block">
                                                ₹{parseFloat(order.total).toLocaleString("en-IN")}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground capitalize">
                                                Terms: {order.paymentTerms.replace("_", " ")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Requested Offering(s) for this Order */}
                                    <div className="rounded-lg bg-muted/40 p-3.5 border border-border/60 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Package className="size-3.5 text-primary" />
                                                Customer Request & Offering Details
                                            </span>
                                            {items.length > 0 && (
                                                <span className="text-[11px] font-normal">
                                                    {items.length} {items.length === 1 ? "offering item" : "offering items"}
                                                </span>
                                            )}
                                        </div>

                                        {items.length === 0 ? (
                                            <div className="text-xs text-muted-foreground py-1">
                                                Standard Packaging Batch &bull; ₹{parseFloat(order.total).toLocaleString("en-IN")}
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/40">
                                                {items.map((item) => (
                                                    <div key={item.id} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-foreground text-sm">
                                                                {item.titleSnapshot}
                                                            </p>
                                                            <p className="text-muted-foreground text-[11px]">
                                                                Requested: <strong className="text-foreground font-medium">{item.quantity.toLocaleString("en-IN")} {item.unitOfMeasureSnapshot}</strong>
                                                                {" "}&bull; Unit Price: <strong className="text-foreground font-medium">₹{parseFloat(item.unitPriceSnapshot).toLocaleString("en-IN")}</strong>
                                                                {" "}&bull; Lead Time: {item.leadTimeDaysMinSnapshot}-{item.leadTimeDaysMaxSnapshot} days
                                                                {" "}&bull; Mode: {item.fulfilmentModeSnapshot.replace("_", " ")}
                                                            </p>
                                                        </div>
                                                        <div className="text-left sm:text-right font-semibold text-foreground">
                                                            ₹{(item.quantity * parseFloat(item.unitPriceSnapshot)).toLocaleString("en-IN")}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {order.notes && (
                                            <div className="mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">Buyer Note: </span>
                                                {order.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Shipping Address & Status Progression Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                                        <div className="text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="size-3.5 shrink-0" />
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
                                                    onClick={() => handleUpdateStatus(order.id, "confirmed")}
                                                    className="h-8 text-xs gap-1.5"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    Accept Order
                                                </Button>
                                            )}

                                            {order.status === "confirmed" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    variant="default"
                                                    onClick={() => handleUpdateStatus(order.id, "processing")}
                                                    className="h-8 text-xs gap-1.5"
                                                >
                                                    <Package className="size-3.5" />
                                                    Start Production
                                                </Button>
                                            )}

                                            {order.status === "processing" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    variant="secondary"
                                                    onClick={() => handleUpdateStatus(order.id, "shipped")}
                                                    className="h-8 text-xs gap-1.5 border"
                                                >
                                                    <Truck className="size-3.5" />
                                                    Mark Dispatched
                                                </Button>
                                            )}

                                            {order.status === "shipped" && (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(order.id, "delivered")}
                                                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    Confirm Delivered
                                                </Button>
                                            )}

                                            {order.status === "delivered" && (
                                                <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30 gap-1 py-1">
                                                    <CheckCircle2 className="size-3" />
                                                    Fulfilled & Completed
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

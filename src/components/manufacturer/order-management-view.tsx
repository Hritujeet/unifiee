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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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

export interface DbOrderItem {
    order: {
        id: string
        orderNumber: string
        status: string
        subtotal: string
        taxTotal: string
        shippingTotal: string
        total: string
        paymentTerms: string
        shippingAddressLine1: string
        shippingCity: string
        shippingState: string
        shippingPincode: string
        createdAt: Date
    }
    buyerName: string | null
    buyerEmail: string | null
    buyerPhone: string | null
}

interface OrderManagementViewProps {
    initialOrders: DbOrderItem[]
}

export function OrderManagementView({ initialOrders }: OrderManagementViewProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<DbOrderItem[]>(initialOrders)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const filtered = orders.filter((item) => {
        const matchesStatus = statusFilter === "all" ? true : item.order.status === statusFilter
        const matchesSearch =
            item.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.buyerName && item.buyerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.order.shippingCity.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
    })

    const handleUpdateStatus = async (
        orderId: string,
        newStatus: "confirmed" | "processing" | "shipped" | "delivered"
    ) => {
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
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <ShoppingCart className="size-6 text-muted-foreground/60" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No orders received yet</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mb-4">
                    When businesses place orders for your packaging offerings, they will appear here for you to accept, produce, and dispatch.
                </p>
                <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Link href="/manufacturer/publish-offering">
                        <Plus className="size-3.5" />
                        Publish Offerings to Get Orders
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
                        placeholder="Search by Order # or Buyer..."
                        className="pl-9 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-36 text-xs h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            <SelectItem value="submitted">New Orders</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">In Production</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders list */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No orders match your filter</p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {filtered.map(({ order, buyerName, buyerEmail, buyerPhone }) => (
                        <Card key={order.id} className="border shadow-xs hover:border-primary/40 transition-colors">
                            <CardContent className="p-4 sm:p-5">
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
                                                        : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs uppercase"
                                                }
                                            >
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Buyer: <strong className="text-foreground">{buyerName || "Business Customer"}</strong> &bull; Placed on {new Date(order.createdAt).toLocaleDateString()}
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

                                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="text-muted-foreground flex items-center gap-1.5">
                                        <MapPin className="size-3.5 shrink-0" />
                                        <span>
                                            {order.shippingAddressLine1}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
                                        </span>
                                    </div>

                                    {/* Quick Actions based on status */}
                                    <div className="flex items-center gap-2">
                                        {order.status === "submitted" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateStatus(order.id, "confirmed")}
                                                className="h-8 text-xs gap-1"
                                            >
                                                <CheckCircle2 className="size-3.5" />
                                                Accept Order
                                            </Button>
                                        )}

                                        {order.status === "confirmed" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleUpdateStatus(order.id, "processing")}
                                                className="h-8 text-xs gap-1"
                                            >
                                                Start Production
                                            </Button>
                                        )}

                                        {order.status === "processing" && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleUpdateStatus(order.id, "shipped")}
                                                className="h-8 text-xs gap-1"
                                            >
                                                <Truck className="size-3.5" />
                                                Mark Dispatched
                                            </Button>
                                        )}

                                        {order.status === "shipped" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateStatus(order.id, "delivered")}
                                                className="h-8 text-xs gap-1"
                                            >
                                                Mark Delivered
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

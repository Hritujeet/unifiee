"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowRight,
    CheckCircle2,
    CreditCard,
    Package,
    Plus,
    Search,
    Truck,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Order,
    useWorkflowStore,
    WORKFLOW_STAGES,
} from "@/lib/business-workflow-store"
import { toast } from "sonner"

export default function OrdersView() {
    const orders = useWorkflowStore((s) => s.orders)
    const updateOrderStatus = useWorkflowStore((s) => s.updateOrderStatus)
    const toggleOrderPaid = useWorkflowStore((s) => s.toggleOrderPaid)

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    const handleAdvanceStatus = (order: Order) => {
        const currentIndex = WORKFLOW_STAGES.indexOf(order.status)
        if (currentIndex < WORKFLOW_STAGES.length - 1) {
            const nextStatus = WORKFLOW_STAGES[currentIndex + 1]
            updateOrderStatus(order.id, nextStatus)
            toast.success(`Order ${order.orderNumber} advanced to "${nextStatus}"!`)
        }
    }

    const handleTogglePaid = (order: Order) => {
        toggleOrderPaid(order.id)
        toast.info(`Order ${order.orderNumber} payment marked as ${!order.paid ? "Paid: Yes" : "Paid: No"}`)
    }

    const filteredOrders = orders.filter((order) => {
        const matchesStatus = statusFilter === "all" || order.status === statusFilter
        const matchesSearch =
            searchQuery.trim() === "" ||
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.requirementTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.deliveryLocation.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesStatus && matchesSearch
    })

    const inProductionCount = orders.filter((o) => o.status === "In Production").length
    const shippedCount = orders.filter((o) => o.status === "Shipped").length
    const deliveredCount = orders.filter((o) => o.status === "Delivered").length

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 text-foreground">
            {/* 1. PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-border/40 pb-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Package className="size-3" />
                        <span>Order Fulfillment Tracking (Eureka MVP Section 7)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                        Orders
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        Track orders through the 6-stage fulfillment machine: Requirement Received → Offers → Order Confirmed → In Production → Shipped → Delivered.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button asChild variant="outline" size="sm" className="h-10 px-4 rounded-xl text-xs font-medium border-border/50 hover:bg-muted/50">
                        <Link href="/business/offers">
                            <span>View offers</span>
                        </Link>
                    </Button>
                    <Button asChild size="sm" className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm hover:shadow-md transition-all">
                        <Link href="/business/requirements/new" className="flex items-center gap-1.5">
                            <Plus className="size-4" />
                            <span>New requirement</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 2. STATS STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Orders</CardTitle>
                        <Package className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Accepted supplier quotes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">In Production</CardTitle>
                        <Package className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{inProductionCount}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Factory run underway</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">In Transit</CardTitle>
                        <Truck className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{shippedCount}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Dispatched for delivery</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Fulfilled</CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{deliveredCount}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Delivered to location</p>
                    </CardContent>
                </Card>
            </div>

            {/* 3. TOOLBAR */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40 w-fit overflow-x-auto max-w-full">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            All ({orders.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("Order Confirmed")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === "Order Confirmed" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Confirmed ({orders.filter((o) => o.status === "Order Confirmed").length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("In Production")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === "In Production" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            In Production ({inProductionCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("Shipped")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === "Shipped" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Shipped ({shippedCount})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search orders, number, supplier..."
                            className="h-9 w-full pl-9 text-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. ORDERS LIST */}
                {filteredOrders.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                            <Package className="size-8 mx-auto text-muted-foreground/50" />
                            <h3 className="text-base font-semibold text-foreground">No active orders found</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                You do not have any orders matching this filter. Accept a quote from your incoming proposals to launch an order.
                            </p>
                            <Button asChild size="sm" className="mt-2 text-xs">
                                <Link href="/business/offers">Review received quotes</Link>
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-5">
                        {filteredOrders.map((order) => {
                            const currentStageIndex = WORKFLOW_STAGES.indexOf(order.status)

                            return (
                                <Card key={order.id} className="hover:border-border transition-all">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className="font-mono text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                                                    {order.orderNumber}
                                                </span>
                                                <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                                                    {order.requirementTitle}
                                                </CardTitle>
                                                <Badge variant="secondary" className="text-xs capitalize font-medium">
                                                    {order.packagingType}
                                                </Badge>
                                            </div>
                                            <CardDescription className="text-xs">
                                                Supplier: <strong>{order.vendorName}</strong> ({order.vendorLocation}) • Quantity: {order.quantity}
                                            </CardDescription>
                                        </div>

                                        <div className="flex items-center gap-2 self-start shrink-0">
                                            {/* Section 8: Paid: yes/no indicator */}
                                            <Badge
                                                variant="outline"
                                                className={`text-xs px-2.5 py-0.5 font-medium ${
                                                    order.paid
                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                                        : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                                }`}
                                            >
                                                {order.paid ? "Paid: Yes" : "Paid: No (Bank Transfer)"}
                                            </Badge>

                                            <Badge
                                                className={`text-xs px-2.5 py-0.5 font-semibold ${
                                                    order.status === "Delivered"
                                                        ? "bg-emerald-600 text-white"
                                                        : order.status === "Shipped"
                                                        ? "bg-amber-600 text-white"
                                                        : "bg-blue-600 text-white"
                                                }`}
                                            >
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        {/* SECTION 7: Exact 6-Stage Progress Tracker */}
                                        <div className="space-y-2.5 bg-muted/20 p-4 rounded-xl border border-border/40">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">Order Lifecycle Stage</span>
                                                <span>Est. Delivery: <strong>{order.estimatedDelivery}</strong></span>
                                            </div>

                                            {/* Step Tracker */}
                                            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pt-1">
                                                {WORKFLOW_STAGES.map((stage, idx) => {
                                                    const isCompleted = idx <= currentStageIndex
                                                    const isCurrent = idx === currentStageIndex

                                                    return (
                                                        <div key={stage} className="space-y-1.5">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${
                                                                    isCompleted
                                                                        ? idx === 5
                                                                            ? "bg-emerald-600"
                                                                            : "bg-blue-600"
                                                                        : "bg-muted"
                                                                } ${isCurrent ? "ring-2 ring-blue-500/40" : ""}`}
                                                            />
                                                            <span
                                                                className={`text-[10px] sm:text-xs block text-center truncate ${
                                                                    isCurrent
                                                                        ? "font-bold text-blue-500"
                                                                        : isCompleted
                                                                        ? "font-medium text-foreground/80"
                                                                        : "text-muted-foreground/60"
                                                                }`}
                                                            >
                                                                {stage}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Order Info & Location */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                            <div className="border border-border/40 rounded-lg p-3 bg-card">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Order Total</span>
                                                <span className="text-base font-bold text-foreground mt-0.5 block">{order.totalPrice}</span>
                                                <span className="text-[11px] text-muted-foreground">Direct bank transfer terms</span>
                                            </div>

                                            <div className="border border-border/40 rounded-lg p-3 bg-card">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Destination Address</span>
                                                <span className="font-medium text-foreground mt-0.5 block truncate">{order.deliveryLocation}</span>
                                                <span className="text-[11px] text-muted-foreground">Standard ground transport</span>
                                            </div>

                                            <div className="border border-border/40 rounded-lg p-3 bg-card">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Timestamp Log</span>
                                                <span className="font-medium text-foreground mt-0.5 block">Placed {order.createdAt}</span>
                                                <span className="text-[11px] text-muted-foreground">{order.updatedAt}</span>
                                            </div>
                                        </div>

                                        {/* Demo State Controls (Section 13: Client/Vendor can move status) */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/30 text-xs">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <span className="font-semibold text-foreground">Interactive Demo:</span>
                                                <span>Advance stage or update payment record</span>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTogglePaid(order)}
                                                    className="h-8 text-xs border-border/50"
                                                >
                                                    <CreditCard className="size-3.5 mr-1" />
                                                    <span>Toggle Paid ({order.paid ? "Yes" : "No"})</span>
                                                </Button>

                                                {currentStageIndex < WORKFLOW_STAGES.length - 1 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAdvanceStatus(order)}
                                                        className="h-8 px-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium gap-1"
                                                    >
                                                        <span>Advance to &ldquo;{WORKFLOW_STAGES[currentStageIndex + 1]}&rdquo;</span>
                                                        <ArrowRight className="size-3" />
                                                    </Button>
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
        </div>
    )
}

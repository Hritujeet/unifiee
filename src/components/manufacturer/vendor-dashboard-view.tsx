"use client"

import Link from "next/link"
import {
    IndianRupee,
    Package,
    ShoppingCart,
    Plus,
    Clock,
    FileSpreadsheet,
    ChevronRight,
    TrendingUp,
    Shield,
    CheckCircle2,
    Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface VendorDashboardViewProps {
    vendorName: string
    companyName: string
    metrics: {
        grossEarnings: number
        settledEarnings: number
        inEscrow: number
        totalOrders: number
        activeOrdersCount: number
        publishedOfferingsCount: number
        activeOfferingsCount: number
        quotationsCount: number
    }
    recentOrders: Array<{
        order: {
            id: string
            orderNumber: string
            status: string
            total: string
            createdAt: Date
        }
        buyerName: string | null
    }>
    recentOfferings: Array<{
        id: string
        title: string
        offeringType: string
        unitPrice: string
        unitOfMeasure: string
        status: string
        minOrderQuantity: number
    }>
}

export default function VendorDashboardView({
    vendorName,
    companyName,
    metrics,
    recentOrders,
    recentOfferings,
}: VendorDashboardViewProps) {
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 17) return "Good afternoon"
        if (hour < 21) return "Good evening"
        return "Welcome back"
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-7 text-foreground pb-12">
            {/* ── 1. Header ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {getGreeting()}, {companyName || vendorName}
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Track your earnings, manage orders, and monitor your published packaging catalog.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="text-xs h-9">
                        <Link href="/manufacturer/offerings">
                            My Offerings ({metrics.publishedOfferingsCount})
                        </Link>
                    </Button>
                    <Button size="sm" asChild className="text-xs h-9 gap-1.5 shadow-xs">
                        <Link href="/manufacturer/publish-offering">
                            <Plus className="size-3.5" />
                            Post Offering
                        </Link>
                    </Button>
                </div>
            </div>

            {/* ── 2. Earnings & Key Metrics Cards ── */}
            <div>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                    Earnings & Orders Overview
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Gross Revenue */}
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium">Total Revenue</CardDescription>
                            <CardTitle className="text-2xl font-bold text-foreground">
                                ₹{metrics.grossEarnings.toLocaleString("en-IN")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                From {metrics.totalOrders} total orders received
                            </p>
                        </CardContent>
                    </Card>

                    {/* Escrow Balance */}
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium">In Escrow</CardDescription>
                            <CardTitle className="text-2xl font-bold text-foreground">
                                ₹{metrics.inEscrow.toLocaleString("en-IN")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Secured funds released upon order delivery
                            </p>
                        </CardContent>
                    </Card>

                    {/* Settled / Paid */}
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium">Settled & Withdrawn</CardDescription>
                            <CardTitle className="text-2xl font-bold text-foreground">
                                ₹{metrics.settledEarnings.toLocaleString("en-IN")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Completed payments transferred
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Orders */}
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium">Active Orders</CardDescription>
                            <CardTitle className="text-2xl font-bold text-foreground">
                                {metrics.activeOrdersCount}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Currently in production or transit
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── 3. Main Dashboard Content Grid ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Column: Recent Orders */}
                <Card className="border shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <ShoppingCart className="size-4 text-primary" />
                                    Recent Orders
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Orders placed by businesses for your packaging
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                                <Link href="/manufacturer/order-dashboard">View all</Link>
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 flex-1">
                        {recentOrders.length === 0 ? (
                            /* Database Empty State */
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <ShoppingCart className="size-6 text-muted-foreground/60" />
                                </div>
                                <h4 className="font-semibold text-sm text-foreground">No orders yet</h4>
                                <p className="text-xs max-w-xs mt-1 text-muted-foreground">
                                    Once businesses discover your offerings and place orders, they will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map(({ order, buyerName }) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 rounded-lg border text-xs"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-foreground">{order.orderNumber}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-[11px]">
                                                Buyer: {buyerName || "Business"} &bull; {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="font-bold text-foreground block">
                                                ₹{parseFloat(order.total).toLocaleString("en-IN")}
                                            </span>
                                            <Button variant="ghost" size="sm" asChild className="h-6 text-[11px] px-1.5 mt-0.5">
                                                <Link href="/manufacturer/order-dashboard">Manage</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Published Offerings */}
                <Card className="border shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Package className="size-4 text-primary" />
                                    Your Published Offerings
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Products available for businesses to order
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                                <Link href="/manufacturer/offerings">View all</Link>
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 flex-1">
                        {recentOfferings.length === 0 ? (
                            /* Database Empty State */
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Package className="size-6 text-muted-foreground/60" />
                                </div>
                                <h4 className="font-semibold text-sm text-foreground">No offerings published yet</h4>
                                <p className="text-xs max-w-xs mt-1 text-muted-foreground mb-4">
                                    Post your cups, boxes, or containers to get listed on the marketplace.
                                </p>
                                <Button asChild size="sm" className="text-xs gap-1.5">
                                    <Link href="/manufacturer/publish-offering">
                                        <Plus className="size-3.5" />
                                        Publish Your First Offering
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOfferings.map((offering) => (
                                    <div
                                        key={offering.id}
                                        className="flex items-center justify-between p-3 rounded-lg border text-xs"
                                    >
                                        <div className="space-y-0.5 max-w-[240px]">
                                            <h4 className="font-semibold text-foreground truncate">
                                                {offering.title}
                                            </h4>
                                            <p className="text-muted-foreground text-[11px] capitalize">
                                                {offering.offeringType.replace("_", " ")} &bull; MOQ: {offering.minOrderQuantity.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="font-bold text-foreground block">
                                                ₹{parseFloat(offering.unitPrice).toFixed(2)}
                                                <span className="text-[10px] text-muted-foreground font-normal"> / {offering.unitOfMeasure}</span>
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    offering.status === "active"
                                                        ? "text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 uppercase mt-1"
                                                        : "text-[10px] bg-muted text-muted-foreground uppercase mt-1"
                                                }
                                            >
                                                {offering.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

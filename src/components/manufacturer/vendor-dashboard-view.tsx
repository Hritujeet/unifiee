"use client"

import Link from "next/link"
import {
    IndianRupee,
    Package,
    ShoppingCart,
    Plus,
    TrendingUp,
    CheckCircle2,
    Truck,
    ShieldCheck,
    ArrowUpRight,
    Boxes,
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
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/lifecycle"

export interface VendorDashboardViewProps {
    vendorName: string
    companyName: string
    metrics: {
        grossEarnings: number
        totalOrders: number
        activeOrdersCount: number
        publishedOfferingsCount: number
        activeOfferingsCount: number
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
        <div className="mx-auto w-full max-w-6xl space-y-8 text-foreground pb-12">
            {/* ── 1. Hero Welcome Banner ── */}
            <div className="rounded-2xl border bg-card p-5 shadow-xs sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/30 text-[11px] font-semibold gap-1.5 py-0.5 px-2.5 rounded-full"
                            >
                                <ShieldCheck className="size-3.5" />
                                Verified Packaging Partner
                            </Badge>
                            <span className="hidden sm:inline text-xs text-muted-foreground">&bull;</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Payments not connected yet
                            </span>
                        </div>

                        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                            {getGreeting()}, {vendorName || companyName || "Partner"}
                        </h1>

                        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Manage your packaging offerings, review buyer orders, and fulfill every order from confirmation to delivery.
                        </p>
                    </div>

                    {/* Quick CTA Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button variant="outline" size="sm" asChild className="text-xs h-9 gap-1.5 bg-background/80 hover:bg-background">
                            <Link href="/manufacturer/offerings">
                                <Boxes className="size-3.5" />
                                My Catalog ({metrics.publishedOfferingsCount})
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="text-xs h-9 gap-1.5 shadow-sm">
                            <Link href="/manufacturer/publish-offering">
                                <Plus className="size-4" />
                                Post Offering
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── 2. Earnings & Key Metrics Cards ── */}
            <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="size-3.5 text-primary" />
                        Commercial performance
                    </h2>
                    <span className="text-[11px] text-muted-foreground">Currency: INR (₹)</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Gross Revenue */}
                    <Card className="border shadow-xs hover:border-primary/40 transition-all hover:shadow-sm group bg-card">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Total Revenue
                                </CardDescription>
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <IndianRupee className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground mt-2">
                                ₹{metrics.grossEarnings.toLocaleString("en-IN")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                Across <strong>{metrics.totalOrders}</strong> total orders
                            </p>
                        </CardContent>
                    </Card>

                    {/* Payment status */}
                    <Card className="border shadow-xs hover:border-amber-500/40 transition-all hover:shadow-sm group bg-card">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Payment status
                                </CardDescription>
                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground mt-2">
                                Payments not connected yet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                Payment is arranged offline in this prototype
                            </p>
                        </CardContent>
                    </Card>

                    {/* Settled / Paid */}
                    <Card className="border shadow-xs hover:border-emerald-500/40 transition-all hover:shadow-sm group bg-card">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Settled & Paid
                                </CardDescription>
                                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <CheckCircle2 className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-2">
                                Payments not connected yet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                Payment is arranged offline in this prototype
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Orders */}
                    <Card className="border shadow-xs hover:border-blue-500/40 transition-all hover:shadow-sm group bg-card">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Active Orders
                                </CardDescription>
                                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <Truck className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground mt-2">
                                {metrics.activeOrdersCount}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                In production or dispatched
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── 3. Split Grid: Customer Orders & Live Catalog Offerings ── */}
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                {/* Left Column: Recent Customer Orders */}
                <Card className="border shadow-xs flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                    <ShoppingCart className="size-4 text-primary" />
                                    Recent Customer Orders
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Buyer orders placed for your packaging offerings
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-8 gap-1 hover:bg-muted font-medium">
                                <Link href="/manufacturer/order-dashboard">
                                    Manage All <ArrowUpRight className="size-3" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 flex-1">
                        {recentOrders.length === 0 ? (
                            /* Clean Empty State */
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center mb-3">
                                    <ShoppingCart className="size-6 text-muted-foreground/60" />
                                </div>
                                <h4 className="font-semibold text-sm text-foreground">No orders received yet</h4>
                                <p className="text-xs max-w-xs mt-1 text-muted-foreground mb-4">
                                    When F&B brands and restaurants place orders for your offerings, they will appear here for you to accept and fulfill.
                                </p>
                                <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
                                    <Link href="/manufacturer/publish-offering">
                                        <Plus className="size-3.5" />
                                        Publish Offerings to Get Orders
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map(({ order, buyerName }) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors text-xs"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-foreground text-sm">
                                                    {order.orderNumber}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        order.status === "delivered"
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] uppercase font-semibold"
                                                            :                                                             order.status === "dispatched"
                                                            ? "bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] uppercase font-semibold"
                                                            : order.status === "in_production" || order.status === "quality_check"
                                                            ? "bg-primary/10 text-primary border-primary/30 text-[10px] uppercase font-semibold"
                                                            : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] uppercase font-semibold"
                                                    }
                                                >
                                                    {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-[11px]">
                                                Buyer: <strong className="text-foreground">{buyerName || "Business Customer"}</strong> &bull; {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="font-extrabold text-foreground text-sm">
                                                ₹{parseFloat(order.total).toLocaleString("en-IN")}
                                            </span>
                                            <Button variant="outline" size="sm" asChild className="h-6 text-[11px] px-2">
                                                <Link href="/manufacturer/order-dashboard">Review</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Your Published Offerings */}
                <Card className="border shadow-xs flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                    <Package className="size-4 text-primary" />
                                    Your Packaging Offerings
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Standardized items listed for business buyers
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-8 gap-1 hover:bg-muted font-medium">
                                <Link href="/manufacturer/offerings">
                                    View All <ArrowUpRight className="size-3" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 flex-1">
                        {recentOfferings.length === 0 ? (
                            /* Clean Empty State */
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center mb-3">
                                    <Package className="size-6 text-muted-foreground/60" />
                                </div>
                                <h4 className="font-semibold text-sm text-foreground">No packaging offerings listed</h4>
                                <p className="text-xs max-w-xs mt-1 text-muted-foreground mb-4">
                                    Post your coffee cups, meal boxes, or pouches to start receiving bulk orders.
                                </p>
                                <Button asChild size="sm" className="text-xs gap-1.5 shadow-xs">
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
                                        className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors text-xs"
                                    >
                                        <div className="space-y-1 max-w-[260px]">
                                            <h4 className="font-semibold text-foreground truncate text-sm">
                                                {offering.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                                                <span className="capitalize">{offering.offeringType.replace("_", " ")}</span>
                                                <span>&bull;</span>
                                                <span>MOQ: {offering.minOrderQuantity.toLocaleString()} {offering.unitOfMeasure}</span>
                                            </div>
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="font-bold text-foreground text-sm">
                                                ₹{parseFloat(offering.unitPrice).toFixed(2)}
                                                <span className="text-[10px] text-muted-foreground font-normal"> / {offering.unitOfMeasure}</span>
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    offering.status === "active"
                                                        ? "text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 uppercase font-semibold"
                                                        : "text-[10px] bg-muted text-muted-foreground uppercase font-semibold"
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

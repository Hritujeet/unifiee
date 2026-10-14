"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    Bell,
    Check,
    ChevronDown,
    ExternalLink,
    Factory,
    FileCheck2,
    Palette,
    Plus,
    Search,
    Sparkles,
    Tag,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

export interface BusinessDashboardProps {
    businessName: string
    initialCounts?: {
        openRequirements: number
        offersToReview: number
        ordersInProgress: number
        spendThisMonth: string
    }
}

interface OrderItem {
    id: string
    name: string
    subtext: string
    stageIndex: number // 1 to 6
    statusLabel: string
    vendorName?: string
}

const STAGES = [
    "Requirement",
    "Offers",
    "Order",
    "Production",
    "QC",
    "Delivery",
]

const DEFAULT_ORDERS: OrderItem[] = [
    {
        id: "ord-1",
        name: "Paper cups 8 oz",
        subtext: "GreenCup Solutions",
        stageIndex: 4, // In production
        statusLabel: "In production",
        vendorName: "GreenCup Solutions",
    },
    {
        id: "ord-2",
        name: "Pizza box 12 in",
        subtext: "Ready to review",
        stageIndex: 2, // Offers in
        statusLabel: "Offers in",
        vendorName: "Delta Eco Packs",
    },
]

export default function BusinessDashboardView({
    businessName,
    initialCounts = {
        openRequirements: 2,
        offersToReview: 3,
        ordersInProgress: 1,
        spendThisMonth: "₹0",
    },
}: BusinessDashboardProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [orders, setOrders] = useState<OrderItem[]>(DEFAULT_ORDERS)
    const [showMoreOrders, setShowMoreOrders] = useState(false)
    const [isProofModalOpen, setIsProofModalOpen] = useState(false)
    const [isOffersModalOpen, setIsOffersModalOpen] = useState(false)
    const [isAiIntakeOpen, setIsAiIntakeOpen] = useState(false)
    const [aiDescription, setAiDescription] = useState("")
    const [proofApproved, setProofApproved] = useState(false)
    const [notificationsRead, setNotificationsRead] = useState(false)
    const [showEmptyState, setShowEmptyState] = useState(false)

    // Attention Queue items
    const [reviewItems, setReviewItems] = useState([
        {
            id: "rev-1",
            type: "offers",
            icon: Tag,
            text: "3 offers received for Pizza box 12 in",
            actionText: "Review offers",
            target: "offers",
        },
        {
            id: "rev-2",
            type: "proof",
            icon: FileCheck2,
            text: "Artwork proof ready for Paper cups",
            actionText: "Review proof",
            target: "proof",
        },
    ])

    const handleActionClick = (target: string) => {
        if (target === "offers") {
            setIsOffersModalOpen(true)
        } else if (target === "proof") {
            setIsProofModalOpen(true)
        }
    }

    const handleApproveProof = () => {
        setProofApproved(true)
        setIsProofModalOpen(false)
        setReviewItems((prev) => prev.filter((i) => i.id !== "rev-2"))
        toast.success("Artwork proof approved! Production will proceed.")
    }

    const handleSelectOffer = (vendor: string) => {
        setIsOffersModalOpen(false)
        setReviewItems((prev) => prev.filter((i) => i.id !== "rev-1"))
        setOrders((prev) =>
            prev.map((o) =>
                o.id === "ord-2"
                    ? { ...o, subtext: vendor, stageIndex: 3, statusLabel: "Order placed" }
                    : o
            )
        )
        toast.success(`Offer from ${vendor} accepted! Moved to Order stage.`)
    }

    const handleCreateRequirementFromAi = () => {
        if (!aiDescription.trim()) {
            toast.error("Please enter a short description.")
            return
        }
        setIsAiIntakeOpen(false)
        toast.success("Requirement created! Matching vendors are preparing offers.")
        router.push("/business/requirements")
    }

    // Filtered orders based on top bar search
    const filteredOrders = orders.filter((o) =>
        searchQuery.trim() === ""
            ? true
            : o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.subtext.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.statusLabel.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <TooltipProvider delayDuration={150}>
            <div className="mx-auto w-full max-w-5xl space-y-4 text-foreground">
                {/* 1. TOP BAR */}
                <div className="flex items-center gap-2.5">
                    {/* Search across user's own orders, offers, vendors */}
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search orders, offers, vendors"
                            className="h-9 w-full rounded-lg border-border/40 bg-card pl-9 text-xs text-foreground placeholder:text-muted-foreground/70 focus-visible:border-border focus-visible:ring-1 focus-visible:ring-blue-500/50"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </Button>
                        )}
                    </div>

                    {/* Notifications bell */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setNotificationsRead(true)}
                                aria-label="Notifications"
                                className="relative size-9 rounded-lg border-border/40 bg-card text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                            >
                                <Bell className="size-4" />
                                {!notificationsRead && reviewItems.length > 0 && (
                                    <span className="absolute top-2 right-2 size-2 rounded-full bg-amber-500 ring-2 ring-background animate-pulse" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-2">
                            <DropdownMenuLabel className="text-xs font-semibold">Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setIsOffersModalOpen(true)}
                                className="flex flex-col items-start gap-1 p-2 text-xs cursor-pointer"
                            >
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Tag className="size-3 text-amber-500" /> 3 offers received
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                    Vendors submitted bids for &ldquo;Pizza box 12 in&rdquo;.
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsProofModalOpen(true)}
                                className="flex flex-col items-start gap-1 p-2 text-xs cursor-pointer"
                            >
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <FileCheck2 className="size-3 text-amber-500" /> Artwork proof ready
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                    Review high-res packaging proof for Paper cups 8 oz.
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Only filled button on the page */}
                    <Button
                        onClick={() => setIsAiIntakeOpen(true)}
                        className="h-9 shrink-0 gap-1 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-500"
                    >
                        <Plus className="size-3.5" /> New requirement
                    </Button>
                </div>

                {/* 2. GREETING LINE */}
                <div className="pt-1">
                    <h1 className="text-lg font-bold tracking-tight text-foreground font-heading">
                        Good morning, {businessName || "Unifiée"}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {reviewItems.length === 0
                            ? "All items are reviewed. Your orders are up to date."
                            : `${reviewItems.length} item${reviewItems.length === 1 ? "" : "s"} waiting for your review.`}
                    </p>
                </div>

                {/* 3. NEEDS YOUR REVIEW (Attention Queue) - Hidden when empty */}
                {reviewItems.length > 0 && !showEmptyState && (
                    <Card size="sm" className="border-amber-500/40 bg-card py-3">
                        <CardHeader className="flex flex-row items-center justify-between pb-1">
                            <CardTitle className="text-xs font-semibold text-foreground">Needs your review</CardTitle>
                            <CardAction>
                                <Button variant="link" size="xs" asChild className="text-[11px] font-medium text-blue-500 hover:text-blue-400 p-0 h-auto">
                                    <Link href="/business/offers">Review all</Link>
                                </Button>
                            </CardAction>
                        </CardHeader>

                        <CardContent className="divide-y divide-border/30 pt-1">
                            {reviewItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 py-2 text-xs"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <item.icon className="size-3.5 shrink-0 text-amber-500" />
                                        <span className="truncate text-foreground/90 font-normal">
                                            {item.text}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="xs"
                                        onClick={() => handleActionClick(item.target)}
                                        className="shrink-0 border-amber-500/30 bg-[#2d1d03] text-amber-400 hover:bg-[#3a2505] hover:text-amber-300 font-medium text-[11px] px-2.5 py-1"
                                    >
                                        {item.actionText}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* 4. KPI ROW (Four cards, all user's own data) */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <Card size="sm" asChild className="border-border/40 bg-card transition-colors hover:border-border hover:bg-card/80 py-3">
                        <Link href="/business/requirements">
                            <CardHeader className="p-0 gap-0.5">
                                <CardDescription className="text-[11px] font-normal text-muted-foreground">
                                    Open requirements
                                </CardDescription>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground font-heading">
                                    {showEmptyState ? "0" : initialCounts.openRequirements}
                                </CardTitle>
                            </CardHeader>
                        </Link>
                    </Card>

                    <Card size="sm" asChild className="border-border/40 bg-card transition-colors hover:border-border hover:bg-card/80 py-3">
                        <Link href="/business/offers">
                            <CardHeader className="p-0 gap-0.5">
                                <CardDescription className="text-[11px] font-normal text-muted-foreground">
                                    Offers to review
                                </CardDescription>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground font-heading">
                                    {showEmptyState ? "0" : reviewItems.filter((i) => i.type === "offers").length > 0 ? "3" : "0"}
                                </CardTitle>
                            </CardHeader>
                        </Link>
                    </Card>

                    <Card size="sm" asChild className="border-border/40 bg-card transition-colors hover:border-border hover:bg-card/80 py-3">
                        <Link href="/business/orders">
                            <CardHeader className="p-0 gap-0.5">
                                <CardDescription className="text-[11px] font-normal text-muted-foreground">
                                    Orders in progress
                                </CardDescription>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground font-heading">
                                    {showEmptyState ? "0" : initialCounts.ordersInProgress}
                                </CardTitle>
                            </CardHeader>
                        </Link>
                    </Card>

                    <Card size="sm" asChild className="border-border/40 bg-card transition-colors hover:border-border hover:bg-card/80 py-3">
                        <Link href="/business/orders">
                            <CardHeader className="p-0 gap-0.5">
                                <CardDescription className="text-[11px] font-normal text-muted-foreground">
                                    Spend this month
                                </CardDescription>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground font-heading">
                                    {showEmptyState ? "₹0" : initialCounts.spendThisMonth}
                                </CardTitle>
                            </CardHeader>
                        </Link>
                    </Card>
                </div>

                {/* EMPTY STATE PROPOSAL FROM PDF: For new user without requirements or orders */}
                {showEmptyState ? (
                    <Card className="border-border/40 bg-card p-6 text-center space-y-4">
                        <CardHeader className="max-w-md mx-auto p-0 space-y-1">
                            <CardTitle className="text-base font-semibold text-foreground font-heading">
                                Get started with packaging sourcing
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Follow 3 simple steps to launch your custom packaging with certified manufacturers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto p-0 pt-2 text-left">
                            <Card size="sm" className="border-border/40 bg-muted/20 p-3 space-y-1">
                                <span className="flex size-6 items-center justify-center rounded-full bg-blue-600/15 text-blue-500 font-bold text-xs">1</span>
                                <h3 className="text-xs font-semibold text-foreground pt-1">Describe packaging</h3>
                                <p className="text-[11px] text-muted-foreground">Use AI intake or enter dimensions and material specs.</p>
                            </Card>
                            <Card size="sm" className="border-border/40 bg-muted/20 p-3 space-y-1">
                                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">2</span>
                                <h3 className="text-xs font-semibold text-foreground pt-1">Review offers</h3>
                                <p className="text-[11px] text-muted-foreground">Receive quotes with lead times from verified vendors.</p>
                            </Card>
                            <Card size="sm" className="border-border/40 bg-muted/20 p-3 space-y-1">
                                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">3</span>
                                <h3 className="text-xs font-semibold text-foreground pt-1">Place order</h3>
                                <p className="text-[11px] text-muted-foreground">Approve artwork proofs and track production directly.</p>
                            </Card>
                        </CardContent>
                        <CardFooter className="justify-center p-0 pt-2 bg-transparent border-t-0">
                            <Button size="sm" onClick={() => setIsAiIntakeOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8">
                                Describe your packaging
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    /* 5. MAIN 2-COLUMN SECTION */
                    <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                        {/* LEFT COLUMN: ACTIVE ORDERS */}
                        <Card size="sm" className="border-border/40 bg-card py-3.5 shadow-xs flex flex-col justify-between">
                            <div>
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-xs font-semibold text-foreground">Active orders</CardTitle>
                                    <CardAction>
                                        <Button variant="link" size="xs" asChild className="text-[11px] font-medium text-blue-500 hover:text-blue-400 p-0 h-auto">
                                            <Link href="/business/orders">Review all orders</Link>
                                        </Button>
                                    </CardAction>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[1.1fr_2fr_80px] items-center gap-2 pb-2 text-[11px] text-muted-foreground/80">
                                        <span>Order</span>
                                        <span className="truncate">Requirement · Offers · Order · Production · QC · Delivery</span>
                                        <span className="text-right">Status</span>
                                    </div>
                                    <Separator className="mb-2" />

                                    {/* Table Rows */}
                                    <div className="divide-y divide-border/20">
                                        {filteredOrders.slice(0, showMoreOrders ? 5 : 2).map((order) => (
                                            <div
                                                key={order.id}
                                                className="grid grid-cols-[1.1fr_2fr_80px] items-center gap-2 py-3 text-xs"
                                            >
                                                {/* Order Name & Subtitle */}
                                                <div className="min-w-0 pr-1">
                                                    <div className="truncate font-medium text-foreground text-xs">
                                                        {order.name}
                                                    </div>
                                                    <div className="truncate text-[11px] text-muted-foreground">
                                                        {order.subtext}
                                                    </div>
                                                </div>

                                                {/* 6-segment stage bar */}
                                                <div className="flex items-center gap-1">
                                                    {STAGES.map((stageName, index) => {
                                                        const stageNumber = index + 1
                                                        const isFilled = stageNumber <= order.stageIndex
                                                        const isCurrent = stageNumber === order.stageIndex

                                                        return (
                                                            <Tooltip key={stageName}>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                                                                            isFilled
                                                                                ? "bg-blue-600 hover:bg-blue-500"
                                                                                : "bg-muted/60 hover:bg-muted"
                                                                        }`}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-[10px] py-1 px-2">
                                                                    <span className="font-semibold">{stageName}</span>
                                                                    {isCurrent && " (Current stage)"}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    })}
                                                </div>

                                                {/* Status label */}
                                                <div className="text-right text-[11px] font-medium text-foreground">
                                                    {order.statusLabel}
                                                </div>
                                            </div>
                                        ))}

                                        {filteredOrders.length === 0 && (
                                            <div className="py-6 text-center text-xs text-muted-foreground">
                                                No active orders matching &ldquo;{searchQuery}&rdquo;.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </div>

                            {/* Centered down arrow button at bottom */}
                            <CardFooter className="justify-center border-t border-border/20 p-0 pt-3 mt-2 bg-transparent">
                                <Button
                                    variant="outline"
                                    size="icon-xs"
                                    onClick={() => setShowMoreOrders((prev) => !prev)}
                                    aria-label="Toggle more orders"
                                    className="rounded-full border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                                >
                                    <ChevronDown
                                        className={`size-3.5 transition-transform duration-200 ${
                                            showMoreOrders ? "rotate-180" : ""
                                        }`}
                                    />
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* RIGHT COLUMN: 3 STACKED CARDS */}
                        <div className="flex flex-col gap-3">
                            {/* Card 1: Start with AI intake */}
                            <Card size="sm" className="border-border/40 bg-card py-3.5 shadow-xs">
                                <CardHeader className="p-0 pb-1">
                                    <CardTitle className="text-xs font-semibold text-foreground">Start with AI intake</CardTitle>
                                    <CardDescription className="mt-1 text-xs text-muted-foreground leading-normal">
                                        Describe what you need. We turn it into a requirement and match vendors.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAiIntakeOpen(true)}
                                        className="w-full text-xs font-medium text-foreground hover:bg-muted/40"
                                    >
                                        Describe your packaging
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Card 2: Explore */}
                            <Card size="sm" className="border-border/40 bg-card py-3.5 shadow-xs space-y-2.5">
                                <CardHeader className="flex flex-row items-center justify-between p-0">
                                    <CardTitle className="text-xs font-semibold text-foreground">Explore</CardTitle>
                                    <CardAction>
                                        <Button variant="link" size="xs" asChild className="text-[11px] font-medium text-blue-500 hover:text-blue-400 p-0 h-auto">
                                            <Link href="/business/explore">Open</Link>
                                        </Button>
                                    </CardAction>
                                </CardHeader>
                                <CardContent className="p-0 flex flex-col gap-1 pt-0.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="w-full justify-between px-2 font-normal text-xs text-muted-foreground hover:text-foreground h-8"
                                    >
                                        <Link href="/business/explore">
                                            <span className="flex items-center gap-2">
                                                <Factory className="size-3.5 text-muted-foreground" />
                                                Explore vendors
                                            </span>
                                            <ArrowRight className="size-3 text-muted-foreground" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="w-full justify-between px-2 font-normal text-xs text-muted-foreground hover:text-foreground h-8"
                                    >
                                        <Link href="/business/designers">
                                            <span className="flex items-center gap-2">
                                                <Palette className="size-3.5 text-muted-foreground" />
                                                Explore designers
                                            </span>
                                            <ArrowRight className="size-3 text-muted-foreground" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Card 3: Recent activity */}
                            <Card size="sm" className="border-border/40 bg-card py-3.5 shadow-xs">
                                <CardHeader className="p-0 pb-1">
                                    <CardTitle className="text-xs font-semibold text-foreground">Recent activity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 pt-2 space-y-1 text-xs text-muted-foreground leading-relaxed">
                                    <p>Offer received · 2h</p>
                                    <p>Requirement submitted · 1d</p>
                                    <p>Profile completed · 2d</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* BOTTOM NOTE / DISCLAIMER */}
                <div className="border-t border-border/30 pt-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>
                        Sample data. Dashboard shows only your own work; full vendor and designer browsing lives in the sidebar.
                    </span>
                    <Button
                        variant="link"
                        size="xs"
                        onClick={() => setShowEmptyState((p) => !p)}
                        className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground p-0 h-auto underline"
                    >
                        {showEmptyState ? "Show demo data" : "Preview empty state"}
                    </Button>
                </div>

                {/* MODAL 1: REVIEW OFFERS DIALOG */}
                <Dialog open={isOffersModalOpen} onOpenChange={setIsOffersModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-semibold">
                                Offers for &ldquo;Pizza box 12 in&rdquo;
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                3 certified packaging manufacturers submitted proposals for 1,000 units.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2.5 py-2">
                            <Card size="sm" className="border-border/50 bg-card p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-semibold text-foreground">Delta Eco Packs</div>
                                        <div className="text-[11px] text-muted-foreground">Bhiwandi, Maharashtra • 12–14 days</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-foreground">₹17.20 <span className="text-[10px] font-normal text-muted-foreground">/ pc</span></div>
                                        <div className="text-[10px] text-muted-foreground">Total: ₹17,200</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleSelectOffer("Delta Eco Packs")}
                                    className="w-full h-7 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                                >
                                    Accept offer
                                </Button>
                            </Card>

                            <Card size="sm" className="border-border/50 bg-card p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-semibold text-foreground">Apex Packaging Ltd.</div>
                                        <div className="text-[11px] text-muted-foreground">Okhla, New Delhi • 8–10 days</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-foreground">₹18.00 <span className="text-[10px] font-normal text-muted-foreground">/ pc</span></div>
                                        <div className="text-[10px] text-muted-foreground">Total: ₹18,000</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleSelectOffer("Apex Packaging Ltd.")}
                                    variant="outline"
                                    className="w-full h-7 text-xs font-medium"
                                >
                                    Accept offer
                                </Button>
                            </Card>

                            <Card size="sm" className="border-border/50 bg-card p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-semibold text-foreground">BoxKraft Industries</div>
                                        <div className="text-[11px] text-muted-foreground">Surat, Gujarat • 6–7 days</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-foreground">₹19.50 <span className="text-[10px] font-normal text-muted-foreground">/ pc</span></div>
                                        <div className="text-[10px] text-muted-foreground">Total: ₹19,500</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleSelectOffer("BoxKraft Industries")}
                                    variant="outline"
                                    className="w-full h-7 text-xs font-medium"
                                >
                                    Accept offer
                                </Button>
                            </Card>
                        </div>

                        <DialogFooter className="flex justify-between items-center sm:justify-between">
                            <Button variant="link" size="xs" asChild className="text-xs text-blue-500 hover:underline p-0 h-auto">
                                <Link href="/business/offers" className="flex items-center gap-1">
                                    Open full offers page <ExternalLink className="size-3" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsOffersModalOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL 2: REVIEW PROOF DIALOG */}
                <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-semibold">
                                Artwork proof — Paper cups 8 oz
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Verify color codes, bleed margins, and alignment before production starts.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            {/* Graphic mockup container */}
                            <Card className="flex flex-col items-center justify-center border-dashed border-border/70 bg-muted/20 p-6 text-center">
                                <div className="size-24 rounded-full border-2 border-blue-500/40 bg-card shadow-inner flex flex-col items-center justify-center p-2">
                                    <div className="size-12 rounded-md bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-sm">
                                        UNIFIÉE
                                    </div>
                                    <span className="text-[9px] text-muted-foreground mt-1">8 oz Coffee</span>
                                </div>
                                <span className="mt-3 text-xs font-semibold text-foreground">Front & Back Wrap Layout</span>
                                <span className="text-[11px] text-muted-foreground">2-color flexographic • CMYK: 0, 72, 100, 0</span>
                            </Card>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <Card size="sm" className="border-border/40 p-2 rounded-md">
                                    <span className="text-muted-foreground block text-[10px]">Print Process</span>
                                    <span className="font-medium text-foreground">Food-safe water-based</span>
                                </Card>
                                <Card size="sm" className="border-border/40 p-2 rounded-md">
                                    <span className="text-muted-foreground block text-[10px]">Cup Specs</span>
                                    <span className="font-medium text-foreground">80mm rim, 280 GSM</span>
                                </Card>
                            </div>
                        </div>

                        <DialogFooter className="flex justify-between items-center sm:justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsProofModalOpen(false)
                                    toast.info("Change request sent to designer.")
                                }}
                                className="text-xs"
                            >
                                Request changes
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApproveProof}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                            >
                                <Check className="size-3.5 mr-1" /> Approve proof
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL 3: AI INTAKE DIALOG */}
                <Dialog open={isAiIntakeOpen} onOpenChange={setIsAiIntakeOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="size-4 text-blue-500" /> Start with AI intake
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Describe your packaging in everyday words. We will parse dimensions, materials, and quantities for vendor quotes.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <Textarea
                                rows={3}
                                value={aiDescription}
                                onChange={(e) => setAiDescription(e.target.value)}
                                placeholder="e.g. 500 corrugated pizza boxes 12x12x2 with matte finish and 2-color brand logo..."
                                className="text-xs resize-none bg-muted/20 focus-visible:ring-1 focus-visible:ring-blue-500"
                            />

                            <div className="space-y-1.5">
                                <span className="text-[11px] font-medium text-muted-foreground">Quick samples:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        "1,000 pizza boxes 12 inch",
                                        "5,000 double wall cups 8 oz",
                                        "2,000 rigid gift boxes",
                                    ].map((s) => (
                                        <Badge
                                            key={s}
                                            variant="outline"
                                            onClick={() => setAiDescription(s)}
                                            className="text-[11px] border-border/50 bg-muted/30 hover:bg-muted font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex justify-between items-center sm:justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsAiIntakeOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleCreateRequirementFromAi}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                            >
                                <Sparkles className="size-3.5 mr-1" /> Create requirement
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}

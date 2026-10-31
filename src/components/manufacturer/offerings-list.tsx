"use client"

import { useState } from "react"
import Link from "next/link"
import { toggleOfferingStatusAction, deleteOfferingAction } from "@/actions/vendor-actions"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Package,
    Plus,
    Search,
    Trash2,
    Clock,
    MapPin,
    CheckCircle2,
} from "lucide-react"
import {
    formatCategoryDisplayName,
    normalizeCategoryKey,
    STANDARD_OFFERING_CATEGORIES,
} from "@/lib/constants/categories"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface DbOfferingItem {
    id: string
    title: string
    description: string
    offeringType: string
    unitPrice: string
    unitOfMeasure: string
    currency: string
    minOrderQuantity: number
    stockAvailable: number | null
    fulfilmentMode: string
    leadTimeDaysMin: number
    leadTimeDaysMax: number
    shippingTerms: string
    city: string
    state: string
    status: string
    attributes?: Record<string, unknown> | null
    createdAt: Date
}

interface OfferingsListProps {
    initialOfferings: DbOfferingItem[]
}

export function OfferingsList({ initialOfferings }: OfferingsListProps) {
    const router = useRouter()
    const [offerings, setOfferings] = useState<DbOfferingItem[]>(initialOfferings)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const filtered = offerings.filter((o) => {
        const matchesStatus = statusFilter === "all" ? true : o.status === statusFilter
        const matchesCategory =
            categoryFilter === "all"
                ? true
                : normalizeCategoryKey(o.offeringType) === normalizeCategoryKey(categoryFilter)
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
            o.title.toLowerCase().includes(searchLower) ||
            o.offeringType.toLowerCase().includes(searchLower) ||
            formatCategoryDisplayName(o.offeringType).toLowerCase().includes(searchLower) ||
            o.city.toLowerCase().includes(searchLower)
        return matchesStatus && matchesCategory && matchesSearch
    })

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === "active" ? "paused" : "active"
        setTogglingId(id)
        try {
            const res = await toggleOfferingStatusAction(id, nextStatus as "active" | "paused")
            if (res.success) {
                setOfferings((prev) =>
                    prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
                )
                toast.success("Status saved")
                router.refresh()
            } else {
                toast.error("Couldn't save status")
            }
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deletingId) return
        const res = await deleteOfferingAction(deletingId)
        if (res.success) {
            setOfferings((prev) => prev.filter((o) => o.id !== deletingId))
            toast.success("Offering deleted")
            setDeletingId(null)
            router.refresh()
        } else {
            toast.error("Couldn't delete offering")
        }
    }

    if (offerings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center bg-card shadow-xs">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Package className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No offerings published yet</h3>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
                    List your cups, boxes, food containers, or pouches on the UNIFIÉE marketplace. Business buyers can immediately configure order quantities and checkout.
                </p>
                <Button asChild size="default" className="gap-2 text-xs shadow-xs">
                    <Link href="/manufacturer/publish-offering">
                        <Plus className="size-4" />
                        Publish Your First Packaging Offering
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search offerings by title or type..."
                        className="pl-9 text-xs h-9 bg-card"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-48 text-xs h-9 bg-card">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {STANDARD_OFFERING_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.key} value={cat.key}>
                                    {cat.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32 text-xs h-9 bg-card">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active ({offerings.filter((o) => o.status === "active").length})</SelectItem>
                            <SelectItem value="paused">Paused ({offerings.filter((o) => o.status === "paused").length})</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button asChild size="sm" className="gap-1.5 text-xs h-9 shadow-xs">
                        <Link href="/manufacturer/publish-offering">
                            <Plus className="size-3.5" />
                            Post Offering
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Offerings Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center text-muted-foreground bg-card">
                    <p className="text-sm font-semibold text-foreground">No offerings match your filters</p>
                    <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or status filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((item) => {
                        const isToggling = togglingId === item.id
                        const unitPriceNum = parseFloat(item.unitPrice) || 0
                        const minOrderValue = unitPriceNum * (item.minOrderQuantity || 0)
                        const attrs = (item.attributes || {}) as Record<string, unknown>

                        return (
                            <Card
                                key={item.id}
                                className="border border-border hover:border-primary/40 shadow-xs transition-colors duration-150 bg-card overflow-hidden flex flex-col justify-between group rounded-xl"
                            >
                                {/* Top Status & Fulfilment Banner - Identical to Live Buyer Directory Preview */}
                                <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStatus(item.id, item.status)}
                                        disabled={isToggling}
                                        className="text-[11px] font-medium text-foreground flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                        title="Click to toggle status"
                                    >
                                        <span
                                            className={`size-2 rounded-full ${
                                                item.status === "active"
                                                    ? "bg-emerald-500"
                                                    : item.status === "paused"
                                                    ? "bg-amber-500"
                                                    : "bg-muted-foreground"
                                            }`}
                                        />
                                        <span>
                                            {isToggling
                                                ? "Updating..."
                                                : item.status === "active"
                                                ? "Live in Catalog"
                                                : item.status === "paused"
                                                ? "Paused"
                                                : "Draft"}
                                        </span>
                                    </button>
                                    <Badge variant="outline" className="text-[9px] uppercase font-semibold tracking-wider">
                                        {(item.fulfilmentMode || "made_to_order").replace("_", " ")}
                                    </Badge>
                                </div>

                                <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        {/* Category & Title */}
                                        <div className="space-y-1">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-semibold capitalize">
                                                {formatCategoryDisplayName(item.offeringType)}
                                            </Badge>
                                            <h3 className="font-heading text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Material & Size / GSM pill badges */}
                                        {Boolean(attrs.size || attrs.material || attrs.gsm) && (
                                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                                                {attrs.size ? (
                                                    <span className="rounded bg-muted px-2 py-0.5 font-medium">
                                                        {String(attrs.size)}
                                                    </span>
                                                ) : null}
                                                {attrs.material ? (
                                                    <span className="rounded bg-muted px-2 py-0.5 font-medium">
                                                        {String(attrs.material)}
                                                    </span>
                                                ) : null}
                                                {attrs.gsm ? (
                                                    <span className="rounded bg-muted px-2 py-0.5 font-medium">
                                                        {String(attrs.gsm)} GSM
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}

                                        {/* Economics Display Box */}
                                        <div className="rounded-xl bg-muted/50 p-3.5 space-y-2 border">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-xs text-muted-foreground">Unit Wholesale Price</span>
                                                <span className="text-lg font-black text-foreground">
                                                    ₹{unitPriceNum > 0 ? unitPriceNum.toFixed(2) : "0.00"}
                                                    <span className="text-xs font-normal text-muted-foreground"> / {item.unitOfMeasure}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                                                <span>Min Order Batch</span>
                                                <span className="font-semibold text-foreground">
                                                    {item.minOrderQuantity.toLocaleString()} {item.unitOfMeasure}s
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                                                <span className="font-medium text-foreground">Min Order Value</span>
                                                <span className="font-bold text-primary text-sm">
                                                    ₹{minOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delivery & Logistics info */}
                                        <div className="space-y-1.5 text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="size-3 text-muted-foreground shrink-0" />
                                                <span>
                                                    Lead Time: <strong>{item.leadTimeDaysMin}-{item.leadTimeDaysMax} days</strong> turnaround
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="size-3 text-muted-foreground shrink-0" />
                                                <span>
                                                    Ships from <strong>{item.city}, {item.state}</strong>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                                                <span>Payments are arranged offline in this prototype</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isToggling}
                                            onClick={() => handleToggleStatus(item.id, item.status)}
                                            className="h-8 text-xs flex-1 font-medium"
                                        >
                                            {item.status === "active" ? "Pause Offering" : "Activate Offering"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingId(item.id)}
                                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            title="Remove from Catalog"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(deletingId)} onOpenChange={() => setDeletingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Offering from Catalog?</DialogTitle>
                        <DialogDescription className="text-xs">
                            This will remove the packaging offering from the marketplace. Business buyers will no longer be able to place new orders for this item.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>Delete Offering</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

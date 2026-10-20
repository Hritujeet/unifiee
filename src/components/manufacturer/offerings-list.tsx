"use client"

import { useState } from "react"
import Link from "next/link"
import { toggleOfferingStatusAction, deleteOfferingAction } from "@/actions/vendor-actions"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
    IndianRupee,
    Boxes,
    Layers,
    Truck,
    Filter,
} from "lucide-react"
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
        const matchesCategory = categoryFilter === "all" ? true : o.offeringType === categoryFilter
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
            o.title.toLowerCase().includes(searchLower) ||
            o.offeringType.toLowerCase().includes(searchLower) ||
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
                toast.success(`Offering status updated to ${nextStatus}`)
                router.refresh()
            } else {
                toast.error(res.error || "Failed to update status")
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
            toast.success("Offering removed from catalog")
            setDeletingId(null)
            router.refresh()
        } else {
            toast.error(res.error || "Failed to delete offering")
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
                        <SelectTrigger className="w-36 text-xs h-9 bg-card">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="paper_cup">Paper Cups</SelectItem>
                            <SelectItem value="pizza_box">Pizza Boxes</SelectItem>
                            <SelectItem value="corrugated_box">Shipping Boxes</SelectItem>
                            <SelectItem value="food_container">Containers</SelectItem>
                            <SelectItem value="pouch">Pouches</SelectItem>
                            <SelectItem value="paper_bag">Paper Bags</SelectItem>
                            <SelectItem value="cutlery">Cutlery</SelectItem>
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((item) => {
                        const isToggling = togglingId === item.id
                        return (
                            <Card
                                key={item.id}
                                className="border shadow-xs hover:border-primary/50 transition-all hover:shadow-sm flex flex-col justify-between overflow-hidden group bg-card"
                            >
                                <CardHeader className="p-4 sm:p-5 pb-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] font-semibold uppercase tracking-wider capitalize py-0.5 px-2"
                                        >
                                            {item.offeringType.replace("_", " ")}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            onClick={() => handleToggleStatus(item.id, item.status)}
                                            className={
                                                item.status === "active"
                                                    ? "cursor-pointer bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold uppercase transition-colors hover:bg-emerald-500/20"
                                                    : "cursor-pointer bg-muted text-muted-foreground text-[10px] font-bold uppercase transition-colors hover:bg-muted/80"
                                            }
                                        >
                                            {isToggling ? "Updating..." : item.status.toUpperCase()}
                                        </Badge>
                                    </div>

                                    <div>
                                        <CardTitle className="text-sm font-bold leading-snug line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                                            {item.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs line-clamp-2 mt-1 leading-relaxed">
                                            {item.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-5 pt-0 space-y-3.5 text-xs">
                                    {/* Economics & Spec Box */}
                                    <div className="rounded-xl bg-muted/40 p-3 space-y-2 border border-border/50">
                                        <div className="flex justify-between items-baseline border-b border-border/40 pb-1.5">
                                            <span className="text-muted-foreground font-medium">Unit Price:</span>
                                            <span className="font-extrabold text-foreground text-sm">
                                                ₹{parseFloat(item.unitPrice).toFixed(2)}
                                                <span className="text-[11px] text-muted-foreground font-normal"> / {item.unitOfMeasure}</span>
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">MOQ</span>
                                                <span className="font-semibold text-foreground">
                                                    {item.minOrderQuantity.toLocaleString()} {item.unitOfMeasure}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Lead Time</span>
                                                <span className="font-semibold text-foreground">
                                                    {item.leadTimeDaysMin}-{item.leadTimeDaysMax} Days
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3 shrink-0" />
                                                {item.city}, {item.state}
                                            </span>
                                            <span className="capitalize">{item.fulfilmentMode.replace("_", " ")}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isToggling}
                                            onClick={() => handleToggleStatus(item.id, item.status)}
                                            className="h-8 text-xs flex-1 font-medium"
                                        >
                                            {item.status === "active" ? "Pause Offering" : "Activate Offering"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingId(item.id)}
                                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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

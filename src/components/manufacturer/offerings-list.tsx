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

    const filtered = offerings.filter((o) => {
        const matchesStatus = statusFilter === "all" ? true : o.status === statusFilter
        const matchesCategory = categoryFilter === "all" ? true : o.offeringType === categoryFilter
        const matchesSearch =
            o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.offeringType.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesCategory && matchesSearch
    })

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === "active" ? "paused" : "active"
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Package className="size-6 text-muted-foreground/60" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No offerings published yet</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mb-4">
                    You haven&apos;t added any packaging products to your catalog yet. Once you publish an offering, businesses will be able to order from you.
                </p>
                <Button asChild size="sm" className="gap-1.5 text-xs">
                    <Link href="/manufacturer/publish-offering">
                        <Plus className="size-3.5" />
                        Post Your First Offering
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
                        placeholder="Search your offerings..."
                        className="pl-9 text-xs"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-36 text-xs h-9">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="paper_cup">Paper Cups</SelectItem>
                            <SelectItem value="pizza_box">Pizza Boxes</SelectItem>
                            <SelectItem value="corrugated_box">Shipping Boxes</SelectItem>
                            <SelectItem value="food_container">Containers</SelectItem>
                            <SelectItem value="pouch">Pouches</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32 text-xs h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button asChild size="sm" className="gap-1.5 text-xs h-9">
                        <Link href="/manufacturer/publish-offering">
                            <Plus className="size-3.5" />
                            Post Offering
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Offerings Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No offerings match your filters</p>
                    <p className="text-xs mt-1">Try resetting the category or status filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((item) => (
                        <Card key={item.id} className="border shadow-xs flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                                        {item.offeringType.replace("_", " ")}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        onClick={() => handleToggleStatus(item.id, item.status)}
                                        className={
                                            item.status === "active"
                                                ? "cursor-pointer bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
                                                : "cursor-pointer bg-muted text-muted-foreground text-[10px]"
                                        }
                                    >
                                        {item.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <CardTitle className="text-sm font-semibold leading-snug line-clamp-1 mt-1">
                                    {item.title}
                                </CardTitle>
                                <CardDescription className="text-xs line-clamp-2 mt-0.5">
                                    {item.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-0 text-xs">
                                <div className="rounded-lg bg-muted/40 p-2.5 space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-muted-foreground">Price:</span>
                                        <span className="font-bold text-foreground text-sm">
                                            ₹{parseFloat(item.unitPrice).toFixed(2)}
                                            <span className="text-[10px] text-muted-foreground font-normal"> / {item.unitOfMeasure}</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>MOQ:</span>
                                        <span className="font-medium text-foreground">{item.minOrderQuantity.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Lead Time:</span>
                                        <span className="font-medium text-foreground">{item.leadTimeDaysMin}-{item.leadTimeDaysMax} Days</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Dispatch:</span>
                                        <span className="font-medium text-foreground">{item.city}, {item.state}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(item.id, item.status)}
                                        className="h-8 text-xs flex-1"
                                    >
                                        {item.status === "active" ? "Pause Listing" : "Activate Listing"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingId(item.id)}
                                        className="size-8 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <Dialog open={Boolean(deletingId)} onOpenChange={() => setDeletingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Offering?</DialogTitle>
                        <DialogDescription className="text-xs">
                            This will remove the offering from your catalog. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

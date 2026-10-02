"use client"

import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "cn"
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    Pencil,
    Trash2,
    Package,
    IndianRupee,
    CalendarDays,
    Building2,
    Hash,
    MessageSquare,
    DollarSign,
} from "lucide-react"

// ─── Schema-derived types ─────────────────────────────────────────────────────
// Mirroring quotation.ts exactly so this component is ready to accept real DB rows.

type QuotationStatus = "pending" | "under_review" | "accepted" | "rejected"
type QuotationCurrency = "INR" | "USD" | "EUR"

interface QuotationLineItem {
    name: string
    description?: string
    qty: number
    unit: string
    unitPrice: number
}

// Maps to quotationTable.$inferSelect (minus DB-only fields like vendorId)
interface Quotation {
    id: string
    orderRef: string
    businessId: string
    businessName: string    // denormalised for display; join from business table
    currency: QuotationCurrency
    totalAmount: string     // Drizzle numeric → string
    lineItems: QuotationLineItem[]
    notes: string | null
    validFrom: string
    validUntil: string
    status: QuotationStatus
    rejectionReason: string | null
    createdAt: string
}

// ─── Mock data (schema-accurate shape) ───────────────────────────────────────

const MOCK_QUOTATIONS: Quotation[] = [
    {
        id: "QT-2026-001",
        orderRef: "ORD-5512",
        businessId: "biz-uuid-1",
        businessName: "The Brew House Café",
        currency: "INR",
        totalAmount: "43500.00",
        validFrom: "2026-09-28T10:30:00Z",
        validUntil: "2026-10-28T10:30:00Z",
        status: "under_review",
        notes: "All items are food-grade certified. Lead time is 7 working days from order confirmation.",
        rejectionReason: null,
        createdAt: "2026-09-28T10:30:00Z",
        lineItems: [
            { name: "Kraft Paper Cups (8oz)", qty: 5000, unit: "pcs", unitPrice: 4.5 },
            { name: "Flat Lids (90mm)", qty: 5000, unit: "pcs", unitPrice: 1.8 },
            { name: "Corrugated Sleeves", qty: 5000, unit: "pcs", unitPrice: 2.4 },
        ],
    },
    {
        id: "QT-2026-002",
        orderRef: "ORD-5489",
        businessId: "biz-uuid-2",
        businessName: "Spice Route Restaurant",
        currency: "INR",
        totalAmount: "72000.00",
        validFrom: "2026-09-25T14:15:00Z",
        validUntil: "2026-10-25T14:15:00Z",
        status: "accepted",
        notes: "Bulk pricing applied for quantity above 10,000 units.",
        rejectionReason: null,
        createdAt: "2026-09-25T14:15:00Z",
        lineItems: [
            { name: "Printed Food Boxes (Large)", qty: 2000, unit: "pcs", unitPrice: 18 },
            { name: "Grease-Proof Paper", qty: 10000, unit: "sheets", unitPrice: 1.2 },
            { name: "Biodegradable Cutlery Set", qty: 2000, unit: "sets", unitPrice: 14.4 },
        ],
    },
    {
        id: "QT-2026-003",
        orderRef: "ORD-5461",
        businessId: "biz-uuid-3",
        businessName: "Cloud Kitchen Co.",
        currency: "INR",
        totalAmount: "31200.00",
        validFrom: "2026-09-20T09:00:00Z",
        validUntil: "2026-10-20T09:00:00Z",
        status: "rejected",
        notes: "Standard terms apply. GST will be added at actuals.",
        rejectionReason: "Price was higher than competing quotations received.",
        createdAt: "2026-09-20T09:00:00Z",
        lineItems: [
            { name: "Insulated Delivery Bags", qty: 100, unit: "pcs", unitPrice: 180 },
            { name: "Tamper-Evident Labels", qty: 5000, unit: "pcs", unitPrice: 2.64 },
        ],
    },
    {
        id: "QT-2026-004",
        orderRef: "ORD-5598",
        businessId: "biz-uuid-4",
        businessName: "Crust & Crumble Bakery",
        currency: "INR",
        totalAmount: "19800.00",
        validFrom: "2026-09-30T11:45:00Z",
        validUntil: "2026-10-30T11:45:00Z",
        status: "pending",
        notes: "Customised branding on boxes as per artwork shared via email.",
        rejectionReason: null,
        createdAt: "2026-09-30T11:45:00Z",
        lineItems: [
            { name: "Window Cake Boxes (6-inch)", qty: 1000, unit: "pcs", unitPrice: 12 },
            { name: "Window Cake Boxes (8-inch)", qty: 500, unit: "pcs", unitPrice: 15.6 },
        ],
    },
]

// ─── Status config (mirrors QUOTATION_STATUS enum values) ────────────────────

const STATUS_CONFIG: Record<QuotationStatus, {
    label: string
    icon: React.ElementType
    className: string
    dotClass: string
}> = {
    pending: {
        label: "Pending",
        icon: Clock,
        className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800",
        dotClass: "bg-amber-500",
    },
    under_review: {
        label: "Under Review",
        icon: AlertCircle,
        className: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800",
        dotClass: "bg-blue-500",
    },
    accepted: {
        label: "Accepted",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800",
        dotClass: "bg-emerald-500",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800",
        dotClass: "bg-red-500",
    },
}

// ─── Currency icon map ─────────────────────────────────────────────────────────

const CurrencyIcon: Record<QuotationCurrency, React.ElementType> = {
    INR: IndianRupee,
    USD: DollarSign,
    EUR: DollarSign, // lucide doesn't have € — use generic
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuotationStatus }) {
    const cfg = STATUS_CONFIG[status]
    const Icon = cfg.icon
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
            cfg.className
        )}>
            <span className={cn("size-1.5 rounded-full shrink-0", cfg.dotClass)} />
            {cfg.label}
        </span>
    )
}

function formatAmount(amount: string, currency: QuotationCurrency) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount))
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    })
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground truncate">{value}</p>
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuotationsList() {
    const [quotations, setQuotations] = useState<Quotation[]>(MOCK_QUOTATIONS)
    const [selected, setSelected] = useState<Quotation | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>("all")

    // Edit state mirrors schema fields editable by vendor
    const [editNotes, setEditNotes] = useState("")
    const [editItems, setEditItems] = useState<QuotationLineItem[]>([])

    const openSheet = (q: Quotation) => {
        setSelected(q)
        setIsEditing(false)
        setSheetOpen(true)
    }

    const startEditing = () => {
        if (!selected) return
        setEditNotes(selected.notes ?? "")
        setEditItems(selected.lineItems.map(i => ({ ...i })))
        setIsEditing(true)
    }

    const saveEdit = () => {
        if (!selected) return
        const newTotal = editItems
            .reduce((s, i) => s + i.qty * i.unitPrice, 0)
            .toFixed(2)
        const updated = quotations.map(q =>
            q.id === selected.id
                ? { ...q, notes: editNotes, lineItems: editItems, totalAmount: newTotal }
                : q
        )
        setQuotations(updated)
        setSelected(updated.find(q => q.id === selected.id) ?? null)
        setIsEditing(false)
    }

    const deleteQuotation = () => {
        if (!selected) return
        setQuotations(prev => prev.filter(q => q.id !== selected.id))
        setDeleteDialogOpen(false)
        setSheetOpen(false)
        setSelected(null)
    }

    const filtered = filterStatus === "all"
        ? quotations
        : quotations.filter(q => q.status === filterStatus)

    // Editable only while the business hasn't acted on it
    const canEdit = selected &&
        (selected.status === "pending" || selected.status === "under_review")
    const canDelete = selected && selected.status !== "accepted"

    return (
        <>
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-heading text-xl font-semibold text-foreground">My Quotations</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {quotations.length} quotation{quotations.length !== 1 ? "s" : ""} submitted
                    </p>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                    <FileText className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">No quotations found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {filterStatus === "all"
                            ? "You haven't submitted any quotations yet."
                            : `No quotations with status "${STATUS_CONFIG[filterStatus as QuotationStatus]?.label ?? filterStatus}".`}
                    </p>
                </div>
            )}

            {/* ── Quotation cards ── */}
            <div className="grid gap-3">
                {filtered.map(q => {
                    const CIcon = CurrencyIcon[q.currency]
                    return (
                        <Card
                            key={q.id}
                            className="cursor-pointer transition-shadow hover:shadow-md"
                            onClick={() => openSheet(q)}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="size-4 shrink-0 text-muted-foreground" />
                                    {q.businessName}
                                </CardTitle>
                                <CardDescription>
                                    Order&nbsp;<span className="font-medium text-foreground">{q.orderRef}</span>
                                    &nbsp;·&nbsp;{q.id}
                                </CardDescription>
                                <CardAction className="flex items-center gap-2">
                                    <StatusBadge status={q.status} />
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                </CardAction>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <CIcon className="size-3.5" />
                                        <span className="font-semibold text-foreground">
                                            {formatAmount(q.totalAmount, q.currency)}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays className="size-3.5" />
                                        Submitted {formatDate(q.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="size-3.5" />
                                        Valid till {formatDate(q.validUntil)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Package className="size-3.5" />
                                        {q.lineItems.length} line item{q.lineItems.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* ── Detail sheet ── */}
            <Sheet open={sheetOpen} onOpenChange={open => { setSheetOpen(open); if (!open) setIsEditing(false) }}>
                <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
                    {selected && (
                        <>
                            <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-5">
                                <div className="flex items-start justify-between gap-3 pr-8">
                                    <div className="min-w-0 flex-1">
                                        <SheetTitle className="truncate text-base leading-tight">
                                            {selected.businessName}
                                        </SheetTitle>
                                        <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                            <span>{selected.id}</span>
                                            <span className="text-border">·</span>
                                            <span>Order {selected.orderRef}</span>
                                        </SheetDescription>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <StatusBadge status={selected.status} />
                                </div>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto">
                                <div className="space-y-6 px-5 py-5">

                                    {/* ─ Quick info grid ─ */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                        <DetailRow icon={Hash} label="Quotation ID" value={selected.id} />
                                        <DetailRow icon={Building2} label="Business" value={selected.businessName} />
                                        <DetailRow icon={CalendarDays} label="Submitted" value={formatDate(selected.createdAt)} />
                                        <DetailRow icon={Clock} label="Valid Until" value={formatDate(selected.validUntil)} />
                                    </div>

                                    <Separator className="-mx-5 w-[calc(100%+40px)]" />

                                    {/* Amount highlight */}
                                    <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3.5">
                                        <span className="text-sm text-muted-foreground">Grand Total</span>
                                        <span className="text-xl font-bold text-foreground tabular-nums">
                                            {formatAmount(
                                                isEditing
                                                    ? editItems.reduce((s, i) => s + i.qty * i.unitPrice, 0).toFixed(2)
                                                    : selected.totalAmount,
                                                selected.currency
                                            )}
                                        </span>
                                    </div>

                                    {/* ─ Line items table ─ */}
                                    <div>
                                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Line Items
                                        </p>
                                        <div className="overflow-hidden rounded-lg border">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                                                        <th className="hidden px-3 py-2 text-right text-xs font-medium text-muted-foreground sm:table-cell">Unit price</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                                                    </tr>
                                                </thead>
                                            <tbody>
                                                {(isEditing ? editItems : selected.lineItems).map((item, idx) => (
                                                    <tr key={idx} className="border-b last:border-0">
                                                        <td className="px-3 py-2.5">
                                                            {isEditing ? (
                                                                <Input
                                                                    value={item.name}
                                                                    onChange={e => {
                                                                        const next = [...editItems]
                                                                        next[idx] = { ...next[idx], name: e.target.value }
                                                                        setEditItems(next)
                                                                    }}
                                                                    className="h-7 text-xs"
                                                                />
                                                            ) : (
                                                                <div>
                                                                    <span className="font-medium">{item.name}</span>
                                                                    {item.description && (
                                                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right text-muted-foreground">
                                                            {isEditing ? (
                                                                <Input
                                                                    type="number"
                                                                    value={item.qty}
                                                                    onChange={e => {
                                                                        const next = [...editItems]
                                                                        next[idx] = { ...next[idx], qty: Number(e.target.value) }
                                                                        setEditItems(next)
                                                                    }}
                                                                    className="h-7 w-20 text-right text-xs"
                                                                />
                                                            ) : `${item.qty.toLocaleString("en-IN")} ${item.unit}`}
                                                        </td>
                                                        <td className="hidden px-3 py-2.5 text-right text-muted-foreground sm:table-cell">
                                                            {isEditing ? (
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.unitPrice}
                                                                    onChange={e => {
                                                                        const next = [...editItems]
                                                                        next[idx] = { ...next[idx], unitPrice: Number(e.target.value) }
                                                                        setEditItems(next)
                                                                    }}
                                                                    className="h-7 w-24 text-right text-xs"
                                                                />
                                                            ) : `${selected.currency} ${item.unitPrice.toFixed(2)}`}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-medium">
                                                            {isEditing
                                                                ? `${selected.currency} ${(editItems[idx].qty * editItems[idx].unitPrice).toFixed(2)}`
                                                                : `${selected.currency} ${(item.qty * item.unitPrice).toFixed(2)}`
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-muted/30">
                                                    <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Total
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-sm font-bold text-foreground">
                                                        {isEditing
                                                            ? formatAmount(
                                                                editItems.reduce((s, i) => s + i.qty * i.unitPrice, 0).toFixed(2),
                                                                selected.currency
                                                            )
                                                            : formatAmount(selected.totalAmount, selected.currency)
                                                        }
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <Separator className="-mx-5 w-[calc(100%+40px)]" />

                                {/* ─ Notes (maps to quotationTable.notes) ─ */}
                                    <div>
                                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            <MessageSquare className="size-3.5" />
                                            Notes &amp; Terms
                                        </p>
                                        {isEditing ? (
                                            <Textarea
                                                value={editNotes}
                                                onChange={e => setEditNotes(e.target.value)}
                                                rows={4}
                                                className="resize-none text-sm"
                                                placeholder="Add notes or terms…"
                                            />
                                        ) : (
                                            <p className="rounded-lg bg-muted/50 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
                                                {selected.notes ?? "No notes added."}
                                            </p>
                                        )}
                                    </div>

                                    {/* ─ Rejection reason (maps to quotationTable.rejectionReason) ─ */}
                                    {selected.status === "rejected" && selected.rejectionReason && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                                                Reason for rejection
                                            </p>
                                            <p className="text-sm leading-relaxed text-red-700 dark:text-red-400">
                                                {selected.rejectionReason}
                                            </p>
                                        </div>
                                    )}

                                    {/* ─ Status banner ─ */}
                                    {(selected.status === "rejected" || selected.status === "accepted") && (
                                        <div className={cn(
                                            "flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm ring-1",
                                            STATUS_CONFIG[selected.status].className
                                        )}>
                                            {(() => { const Icon = STATUS_CONFIG[selected.status].icon; return <Icon className="mt-0.5 size-4 shrink-0" /> })()}
                                            <span className="leading-relaxed">
                                                {selected.status === "accepted"
                                                    ? "This quotation has been accepted. Contact the business to confirm next steps."
                                                    : "This quotation was not accepted. You can only delete it."}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─ Footer actions ─ */}
                            <SheetFooter className="shrink-0 border-t bg-muted/30 px-5 py-4">
                                {isEditing ? (
                                    <div className="flex w-full gap-2.5">
                                        <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </Button>
                                        <Button className="flex-1" onClick={saveEdit}>
                                            Save Changes
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex w-full gap-2.5">
                                        {canDelete && (
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => setDeleteDialogOpen(true)}
                                                title="Delete quotation"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                        {canEdit ? (
                                            <Button variant="outline" className="flex-1" onClick={startEditing}>
                                                <Pencil className="size-4" />
                                                Edit Quotation
                                            </Button>
                                        ) : !canDelete ? (
                                            <p className="flex-1 text-center text-xs text-muted-foreground">
                                                No actions available for this quotation.
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Delete confirm dialog ── */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Quotation?</DialogTitle>
                        <DialogDescription>
                            This will permanently remove quotation&nbsp;
                            <span className="font-medium text-foreground">{selected?.id}</span>&nbsp;for&nbsp;
                            <span className="font-medium text-foreground">{selected?.businessName}</span>.
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={deleteQuotation}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

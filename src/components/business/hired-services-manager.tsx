"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState, useTransition } from "react"
import {
    ArrowRight,
    ArrowUpRight,
    Briefcase,
    Calendar,
    Check,
    CheckCircle2,
    Clock3,
    DollarSign,
    ExternalLink,
    FileText,
    Layers,
    Loader2,
    Mail,
    MessageSquare,
    Palette,
    Plus,
    RotateCcw,
    Search,
    Send,
    Sparkles,
    User,
    X,
} from "lucide-react"
import { toast } from "sonner"
import { trackCustomProject } from "@/actions/business-hired-services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    HIRED_SERVICE_STATUS_LABELS,
    HIRED_SERVICE_STATUS_COLORS,
    getDeadlineInfo,
    type HiredServiceStatus,
} from "@/lib/hired-services/lifecycle"
import type { HiredDesignerService } from "@/lib/business/marketplace"

function formatPrice(value: string | number) {
    const amount = Number(value)
    return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "Custom"
}

export function HiredServicesManager({ services }: { services: HiredDesignerService[] }) {
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [statusTab, setStatusTab] = useState<"all" | "requested" | "active" | "delivered" | "completed" | "cancelled">("all")

    // Add Custom Project Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [customForm, setCustomForm] = useState({
        serviceTitle: "",
        designerName: "",
        designerEmail: "",
        price: "",
        pricingModel: "per_project" as "per_project" | "hourly" | "per_design",
        turnaroundDays: "5",
    })

    // Counts
    const counts = useMemo(() => {
        let requested = 0
        let active = 0
        let delivered = 0
        let completed = 0
        let cancelled = 0

        for (const s of services) {
            if (s.status === "requested") requested++
            else if (s.status === "active" || s.status === "revision_requested") active++
            else if (s.status === "delivered") delivered++
            else if (s.status === "completed" || s.status === "closed") completed++
            else if (s.status === "cancelled" || s.status === "declined" || s.status === "expired") cancelled++
        }
        return { requested, active, delivered, completed, cancelled }
    }, [services])

    const totalCommitted = useMemo(() => {
        return services.reduce((acc, s) => {
            const val = Number(s.price)
            return acc + (Number.isFinite(val) ? val : 0)
        }, 0)
    }, [services])

    // Filtered visible services
    const filteredServices = useMemo(() => {
        const q = search.trim().toLowerCase()
        return services.filter((service) => {
            const s = service.status as HiredServiceStatus

            let matchesTab = true
            if (statusTab === "requested") matchesTab = s === "requested"
            else if (statusTab === "active") matchesTab = s === "active" || s === "revision_requested"
            else if (statusTab === "delivered") matchesTab = s === "delivered"
            else if (statusTab === "completed") matchesTab = s === "completed" || s === "closed"
            else if (statusTab === "cancelled") matchesTab = s === "cancelled" || s === "declined" || s === "expired"

            const matchesSearch =
                !q ||
                service.serviceTitle.toLowerCase().includes(q) ||
                service.designerName.toLowerCase().includes(q) ||
                service.designerEmail.toLowerCase().includes(q)

            return matchesTab && matchesSearch
        })
    }, [services, statusTab, search])

    async function handleAddCustomProject(e: React.FormEvent) {
        e.preventDefault()
        if (!customForm.serviceTitle.trim() || !customForm.designerName.trim() || !customForm.designerEmail.trim()) {
            toast.error("Please fill in project title, designer name, and email.")
            return
        }

        setIsAdding(true)
        try {
            const result = await trackCustomProject({
                serviceTitle: customForm.serviceTitle,
                designerName: customForm.designerName,
                designerEmail: customForm.designerEmail,
                price: customForm.price || "0",
                pricingModel: customForm.pricingModel,
                turnaroundDays: customForm.turnaroundDays || "5",
            })

            if (!result.success) {
                toast.error("Couldn't add project")
                return
            }

            toast.success("Project added")
            setIsAddOpen(false)
            setCustomForm({
                serviceTitle: "",
                designerName: "",
                designerEmail: "",
                price: "",
                pricingModel: "per_project",
                turnaroundDays: "5",
            })
            router.refresh()
        } catch {
            toast.error("Couldn't add project")
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Stat Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">In Progress</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                            <Clock3 className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            {counts.active}
                        </span>
                        {counts.active > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Active designer deliverables</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Awaiting Review</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                            <FileText className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            {counts.delivered}
                        </span>
                        {counts.delivered > 0 && (
                            <span className="rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-bold text-purple-600">
                                Needs Action
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Deliveries ready for your review</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Completed</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            {counts.completed}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Final dielines ready for manufacturing</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Total Budget</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <DollarSign className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            ₹{totalCommitted.toLocaleString("en-IN")}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Agreed project commitments</p>
                </div>
            </div>

            {/* Controls Bar: Tabs, Search, Add */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-border/60 bg-card p-3 sm:p-4 shadow-xs">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
                    {[
                        { key: "all", label: `All (${services.length})` },
                        { key: "requested", label: `Requested (${counts.requested})` },
                        { key: "active", label: `In Progress (${counts.active})` },
                        { key: "delivered", label: `Delivered (${counts.delivered})` },
                        { key: "completed", label: `Completed (${counts.completed})` },
                        { key: "cancelled", label: `Cancelled / Declined (${counts.cancelled})` },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusTab(tab.key as any)}
                            className={`rounded-lg px-3 py-1.5 shrink-0 transition-all ${
                                statusTab === tab.key
                                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search & Track Button */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-60">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter by title or designer..."
                            className="h-8.5 pl-8 text-xs bg-background/50 border-border/60"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsAddOpen(true)}
                        className="h-8.5 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shrink-0"
                    >
                        <Plus className="size-3.5" />
                        <span>Track External Project</span>
                    </Button>
                </div>
            </div>

            {/* List */}
            {filteredServices.length > 0 ? (
                <div className="space-y-4">
                    {filteredServices.map((service) => {
                        const status = service.status as HiredServiceStatus
                        const deadline = getDeadlineInfo(service.dueAt)
                        const workspaceUrl = `/business/hired-services/${service.id}`

                        return (
                            <article
                                key={service.id}
                                className="group rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all duration-200 hover:border-blue-500/40 hover:shadow-sm space-y-4"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className="relative size-14 shrink-0 rounded-2xl overflow-hidden border bg-muted flex items-center justify-center">
                                            {service.sampleImage ? (
                                                <Image
                                                    src={service.sampleImage}
                                                    alt={service.serviceTitle}
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Palette className="size-7 text-blue-500" />
                                            )}
                                        </div>

                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={workspaceUrl}
                                                    className="font-heading text-base font-semibold text-foreground group-hover:text-blue-500 transition-colors truncate"
                                                >
                                                    {service.serviceTitle}
                                                </Link>

                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${HIRED_SERVICE_STATUS_COLORS[status]}`}>
                                                    {HIRED_SERVICE_STATUS_LABELS[status] || status}
                                                </span>

                                                {service.packageTier && (
                                                    <Badge variant="outline" className="capitalize text-[10px]">
                                                        {service.packageTier}
                                                    </Badge>
                                                )}

                                                {service.unreadMessagesCount && service.unreadMessagesCount > 0 ? (
                                                    <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.2 text-[10px] font-bold text-white animate-pulse">
                                                        <MessageSquare className="size-3" />
                                                        {service.unreadMessagesCount} unread
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span className="font-medium text-foreground">{service.designerName}</span>
                                                <span>·</span>
                                                <span className="font-mono text-[11px]">{service.designerEmail}</span>
                                            </p>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                                                <span className="font-semibold text-foreground">
                                                    {formatPrice(service.price)}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 className="size-3" />
                                                    {service.deliveryDays || service.turnaroundDays}d delivery
                                                </span>
                                                {service.dueAt && (
                                                    <span className={`inline-flex items-center gap-1 ${deadline.isLate ? "text-rose-500 font-semibold" : ""}`}>
                                                        <Calendar className="size-3" />
                                                        {deadline.label}
                                                    </span>
                                                )}
                                                <span>
                                                    Ordered: {new Date(service.hiredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="h-8.5 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                                        >
                                            <Link href={workspaceUrl}>
                                                <span>Open Workspace</span>
                                                <ArrowRight className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center space-y-3">
                    <Briefcase className="size-8 text-muted-foreground/40 mx-auto" />
                    <h3 className="font-heading text-base font-semibold text-foreground">
                        No projects match your filter
                    </h3>
                    <p className="max-w-md mx-auto text-xs text-muted-foreground">
                        Hire packaging artists from the marketplace or track external studio deliverables here.
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5">
                            <Link href="/business/designers">
                                <Palette className="size-3.5" />
                                <span>Browse Packaging Designers</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Custom Project Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Plus className="size-4 text-blue-500" />
                            <span>Track an External Project</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Record a project with an external freelance artist to track milestones, files, and deadlines in UNIFIÉE.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddCustomProject} className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Project Title</label>
                            <Input
                                required
                                value={customForm.serviceTitle}
                                onChange={(e) => setCustomForm({ ...customForm, serviceTitle: e.target.value })}
                                placeholder="e.g. Rigid Box Dieline & Foil Artwork"
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">Designer Name</label>
                                <Input
                                    required
                                    value={customForm.designerName}
                                    onChange={(e) => setCustomForm({ ...customForm, designerName: e.target.value })}
                                    placeholder="e.g. Rahul Sen"
                                    className="h-8.5 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">Designer Email</label>
                                <Input
                                    required
                                    type="email"
                                    value={customForm.designerEmail}
                                    onChange={(e) => setCustomForm({ ...customForm, designerEmail: e.target.value })}
                                    placeholder="designer@studio.com"
                                    className="h-8.5 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">Agreed Budget (₹)</label>
                                <Input
                                    type="number"
                                    value={customForm.price}
                                    onChange={(e) => setCustomForm({ ...customForm, price: e.target.value })}
                                    placeholder="5000"
                                    className="h-8.5 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">Delivery Days</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={customForm.turnaroundDays}
                                    onChange={(e) => setCustomForm({ ...customForm, turnaroundDays: e.target.value })}
                                    placeholder="5"
                                    className="h-8.5 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isAdding}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                            >
                                {isAdding ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                <span>Save & Track</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

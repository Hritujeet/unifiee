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
    LoaderCircle,
    Mail,
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
import { completeHiredDesignerService, trackCustomProject } from "@/actions/business-hired-services"
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
import type { HiredDesignerService } from "@/lib/business/marketplace"

function formatPrice(value: string) {
    const amount = Number(value)
    return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "Custom"
}

export function HiredServicesManager({ services }: { services: HiredDesignerService[] }) {
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all")
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const inFlightRef = useRef(false)

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

    // Metric Calculations
    const activeCount = services.filter((s) => s.status === "active").length
    const completedCount = services.filter((s) => s.status === "completed").length
    const totalBudget = services.reduce((acc, s) => {
        const val = Number(s.price)
        return acc + (Number.isFinite(val) ? val : 0)
    }, 0)
    const avgTurnaround = services.length
        ? Math.round(services.reduce((acc, s) => acc + (s.turnaroundDays || 0), 0) / services.length)
        : 0

    // Filtered visible services
    const filteredServices = useMemo(() => {
        const q = search.trim().toLowerCase()
        return services.filter((service) => {
            const matchesStatus =
                statusFilter === "all" || service.status === statusFilter
            const matchesSearch =
                !q ||
                service.serviceTitle.toLowerCase().includes(q) ||
                service.designerName.toLowerCase().includes(q) ||
                service.designerEmail.toLowerCase().includes(q)
            return matchesStatus && matchesSearch
        })
    }, [services, statusFilter, search])

    function completeService(serviceId: string) {
        if (inFlightRef.current) return
        inFlightRef.current = true
        setPendingId(serviceId)
        startTransition(async () => {
            try {
                const result = await completeHiredDesignerService(serviceId, crypto.randomUUID())
                if (!result.success) {
                    toast.error(result.error ?? "Could not update this service.")
                    return
                }
                toast.success("Service marked as completed! Artwork ready for manufacturing quotes.")
                router.refresh()
            } catch {
                toast.error("Could not update this service. Please try again.")
            } finally {
                inFlightRef.current = false
                setPendingId(null)
            }
        })
    }

    async function handleAddCustomProject(e: React.FormEvent) {
        e.preventDefault()
        if (inFlightRef.current) return
        if (!customForm.serviceTitle.trim() || !customForm.designerName.trim() || !customForm.designerEmail.trim()) {
            toast.error("Please fill in the project title, designer name, and email.")
            return
        }

        inFlightRef.current = true
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
                toast.error(result.error ?? "Could not add custom project.")
                return
            }

            toast.success("Project added to your hired services tracker!")
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
            toast.error("Failed to add project. Please try again.")
        } finally {
            inFlightRef.current = false
            setIsAdding(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* 1. Stat Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Active Projects */}
                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">In Progress</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                            <Clock3 className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            {activeCount}
                        </span>
                        {activeCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Active designer deliverables</p>
                </div>

                {/* Completed Projects */}
                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Completed</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            {completedCount}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Final dielines & artwork ready</p>
                </div>

                {/* Tracked Investment */}
                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Total Budget</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <DollarSign className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            ₹{totalBudget.toLocaleString("en-IN")}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Committed across projects</p>
                </div>

                {/* Turnaround Time */}
                <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Avg. Turnaround</span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                            <Calendar className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                            {avgTurnaround ? `${avgTurnaround}d` : "—"}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Delivery turnaround standard</p>
                </div>
            </div>

            {/* 2. Controls Bar (Tabs, Search, Add Button) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-card p-3 shadow-xs">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            statusFilter === "all"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        All ({services.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter("active")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            statusFilter === "active"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        In Progress ({activeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter("completed")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            statusFilter === "completed"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        Completed ({completedCount})
                    </button>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-56">
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
                        <span>Track Project</span>
                    </Button>
                </div>
            </div>

            {/* 3. Project List */}
            {filteredServices.length > 0 ? (
                <div className="space-y-4">
                    {filteredServices.map((service) => {
                        const isDone = service.status === "completed"
                        const hiredDate = new Date(service.hiredAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })
                        const completedDate = service.completedAt
                            ? new Date(service.completedAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                              })
                            : null

                        return (
                            <article
                                key={service.id}
                                className="group rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all duration-200 hover:border-blue-500/40 hover:shadow-sm"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    {/* Left: Icon / Thumbnail + Info */}
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div
                                            className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-inner ${
                                                isDone
                                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                                    : "border-blue-500/20 bg-blue-500/10 text-blue-500"
                                            }`}
                                        >
                                            {isDone ? (
                                                <CheckCircle2 className="size-7" />
                                            ) : (
                                                <Palette className="size-7" />
                                            )}
                                        </div>

                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-heading text-base font-semibold text-foreground truncate">
                                                    {service.serviceTitle}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        isDone
                                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                    }`}
                                                >
                                                    {!isDone && <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                                    {isDone ? "Completed" : "In Progress"}
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span className="font-medium text-foreground">{service.designerName}</span>
                                                <span>·</span>
                                                <span className="font-mono text-[11px]">{service.designerEmail}</span>
                                            </p>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">
                                                    {formatPrice(service.price)}
                                                    <span className="text-[11px] font-normal text-muted-foreground ml-1">
                                                        /{service.pricingModel.replaceAll("_", " ")}
                                                    </span>
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 className="size-3 text-muted-foreground" />
                                                    {service.turnaroundDays} days delivery
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="size-3 text-muted-foreground" />
                                                    Tracked: {hiredDate}
                                                </span>
                                                {completedDate && (
                                                    <span className="text-emerald-500">
                                                        Completed: {completedDate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                                        {/* Contact Designer */}
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="h-8.5 text-xs border-border/60 hover:bg-muted"
                                        >
                                            <a
                                                href={`mailto:${service.designerEmail}?subject=${encodeURIComponent(
                                                    `Project Update: ${service.serviceTitle}`
                                                )}`}
                                            >
                                                <Mail className="size-3.5 mr-1 text-blue-500" />
                                                Contact
                                            </a>
                                        </Button>

                                        {/* View Profile if designerId */}
                                        {service.designerId && (
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-8.5 text-xs border-border/60 hover:bg-muted"
                                            >
                                                <Link href={`/designers/${service.designerId}`}>
                                                    Profile <ArrowUpRight className="size-3 ml-0.5" />
                                                </Link>
                                            </Button>
                                        )}

                                        {/* Mark Complete */}
                                        {!isDone ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() => completeService(service.id)}
                                                className="h-8.5 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                                            >
                                                {isPending && pendingId === service.id ? (
                                                    <LoaderCircle className="size-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="size-3.5" />
                                                )}
                                                <span>Mark Complete</span>
                                            </Button>
                                        ) : (
                                            /* Link to RFQ requirement */
                                            <Button
                                                asChild
                                                size="sm"
                                                className="h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                                            >
                                                <Link href="/business/requirements">
                                                    <span>Quote with Vendors</span>
                                                    <ArrowRight className="size-3.5" />
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Milestone Progress Strip */}
                                <div className="mt-5 border-t border-border/40 pt-4">
                                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-medium text-muted-foreground">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white text-[9px]">
                                                ✓
                                            </div>
                                            <span className="text-foreground">Scope Agreed</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white text-[9px]">
                                                ✓
                                            </div>
                                            <span className="text-foreground">Initial Concept</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div
                                                className={`flex size-5 items-center justify-center rounded-full text-[9px] ${
                                                    isDone
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-blue-500/20 text-blue-500"
                                                }`}
                                            >
                                                {isDone ? "✓" : "3"}
                                            </div>
                                            <span className={isDone ? "text-foreground" : "text-blue-500 font-semibold"}>
                                                Revisions
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div
                                                className={`flex size-5 items-center justify-center rounded-full text-[9px] ${
                                                    isDone
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {isDone ? "✓" : "4"}
                                            </div>
                                            <span className={isDone ? "text-emerald-500 font-semibold" : ""}>
                                                Dielines & Files
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
                /* Empty State */
                <div className="rounded-2xl border border-dashed border-border/60 bg-card p-8 sm:p-12 text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
                        <Briefcase className="size-7" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                        {services.length ? "No projects match your filter" : "No hired creative projects tracked yet"}
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {services.length
                            ? "Try clearing your search query or switching to another status tab."
                            : "When you hire a packaging designer or collaborate with external studios, track their milestones here so final print-ready artwork is ready for manufacturer bidding."}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5">
                            <Link href="/business/designers">
                                <Palette className="size-3.5" />
                                <span>Browse Packaging Designers</span>
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddOpen(true)}
                            className="text-xs gap-1.5 border-border/60"
                        >
                            <Plus className="size-3.5" />
                            <span>Track an External Project</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* 4. Add Custom Project Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-semibold flex items-center gap-2">
                            <Plus className="size-5 text-blue-500" />
                            Track a Packaging Design Project
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Record an active project with an internal or external designer to monitor progress, turnaround, and deliverables.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddCustomProject} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Project Title</label>
                            <Input
                                required
                                value={customForm.serviceTitle}
                                onChange={(e) => setCustomForm({ ...customForm, serviceTitle: e.target.value })}
                                placeholder="e.g. Rigid Box Dieline & Foil Artwork"
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Designer Name</label>
                                <Input
                                    required
                                    value={customForm.designerName}
                                    onChange={(e) => setCustomForm({ ...customForm, designerName: e.target.value })}
                                    placeholder="e.g. Rahul Sen"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Designer Email</label>
                                <Input
                                    required
                                    type="email"
                                    value={customForm.designerEmail}
                                    onChange={(e) => setCustomForm({ ...customForm, designerEmail: e.target.value })}
                                    placeholder="designer@studio.com"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Agreed Budget (₹)</label>
                                <Input
                                    type="number"
                                    value={customForm.price}
                                    onChange={(e) => setCustomForm({ ...customForm, price: e.target.value })}
                                    placeholder="5000"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Delivery Turnaround (Days)</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={customForm.turnaroundDays}
                                    onChange={(e) => setCustomForm({ ...customForm, turnaroundDays: e.target.value })}
                                    placeholder="5"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isAdding}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                            >
                                {isAdding ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                <span>Save & Track</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

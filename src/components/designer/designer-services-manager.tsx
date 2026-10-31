"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    BriefcaseBusiness,
    Clock3,
    Edit3,
    ExternalLink,
    Eye,
    ImagePlus,
    Loader2,
    MoreVertical,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { toggleGigStatus, deleteGigAction } from "@/actions/designer-services"
import { GigEditorDialog } from "@/components/designer/gig-editor-dialog"
import type { DesignerService, DesignerServicePackage, DesignerServiceExtra } from "@/lib/db/schema/designer-service"

export type ServiceWithRelations = DesignerService & {
    packages?: DesignerServicePackage[]
    extras?: DesignerServiceExtra[]
}

const statusColors: Record<string, string> = {
    published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    draft: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    paused: "bg-muted text-muted-foreground border-border/60",
}

export function DesignerServicesManager({
    services,
    hasBio = true,
    hasSpecialization = true,
}: {
    services: ServiceWithRelations[]
    hasBio?: boolean
    hasSpecialization?: boolean
}) {
    const router = useRouter()
    const [editorOpen, setEditorOpen] = useState(false)
    const [editingGig, setEditingGig] = useState<ServiceWithRelations | undefined>(undefined)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [deleteConfirmGig, setDeleteConfirmGig] = useState<ServiceWithRelations | null>(null)

    const handleCreateNew = () => {
        setEditingGig(undefined)
        setEditorOpen(true)
    }

    const handleEdit = (gig: ServiceWithRelations) => {
        setEditingGig(gig)
        setEditorOpen(true)
    }

    const handleTogglePause = async (gig: ServiceWithRelations) => {
        const nextStatus = gig.status === "published" ? "paused" : "published"
        setLoadingId(gig.id)
        try {
            const res = await toggleGigStatus(gig.id, nextStatus)
            if (res.success) {
                toast.success(nextStatus === "published" ? "Gig published" : "Gig paused")
                router.refresh()
            } else {
                toast.error("Couldn't save gig")
            }
        } catch {
            toast.error("Couldn't save gig")
        } finally {
            setLoadingId(null)
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirmGig) return
        const gig = deleteConfirmGig
        setLoadingId(gig.id)
        try {
            const res = await deleteGigAction(gig.id)
            if (res.success) {
                toast.success("Gig deleted")
                setDeleteConfirmGig(null)
                router.refresh()
            } else {
                toast.error("Couldn't delete gig")
            }
        } catch {
            toast.error("Couldn't delete gig")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                    {services.length} {services.length === 1 ? "gig listed" : "gigs listed"}
                </p>
                <Button onClick={handleCreateNew} className="text-xs gap-1.5 h-9">
                    <Plus className="size-4" />
                    <span>Create New Gig</span>
                </Button>
            </div>

            {services.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {services.map((gig) => {
                        const basicPkg = gig.packages?.find((p) => p.tier === "basic")
                        const price = basicPkg ? Number(basicPkg.price) : Number(gig.price)
                        const turnaround = basicPkg ? basicPkg.deliveryDays : gig.turnaroundDays
                        const revisions = basicPkg ? basicPkg.revisionsIncluded : gig.revisionsIncluded
                        const images = gig.sampleImages?.length ? gig.sampleImages : []
                        const isLoading = loadingId === gig.id

                        return (
                            <article
                                key={gig.id}
                                className={`flex flex-col rounded-xl border border-border bg-card shadow-xs transition-colors duration-150 hover:border-primary/40 overflow-hidden ${
                                    isLoading ? "opacity-60 pointer-events-none" : ""
                                }`}
                            >
                                {/* Cover Thumbnail (16:10 Ratio) */}
                                <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                                    {images[0] ? (
                                        <Image
                                            src={images[0]}
                                            alt={gig.title}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                            <ImagePlus className="size-8" />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute left-3 top-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border  ${statusColors[gig.status] || statusColors.paused}`}>
                                            {gig.status}
                                        </span>
                                    </div>

                                    {/* Action dropdown */}
                                    <div className="absolute right-3 top-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex size-7 items-center justify-center rounded-full bg-black/60  text-white hover:bg-black/80 transition-colors"
                                                >
                                                    <MoreVertical className="size-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="text-xs">
                                                <DropdownMenuItem onClick={() => handleEdit(gig)} className="gap-2 cursor-pointer">
                                                    <Edit3 className="size-3.5" />
                                                    <span>Edit Gig</span>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => handleTogglePause(gig)} className="gap-2 cursor-pointer">
                                                    {gig.status === "published" ? (
                                                        <>
                                                            <Pause className="size-3.5 text-amber-500" />
                                                            <span>Pause Gig</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="size-3.5 text-emerald-500" />
                                                            <span>Publish Gig</span>
                                                        </>
                                                    )}
                                                </DropdownMenuItem>

                                                {gig.slug && gig.status === "published" && (
                                                    <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                                        <Link href={`/business/designers/${gig.slug}`} target="_blank">
                                                            <Eye className="size-3.5" />
                                                            <span>View in Marketplace</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() => setDeleteConfirmGig(gig)}
                                                    className="gap-2 text-destructive cursor-pointer"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider capitalize">
                                            {gig.category?.replace(/_/g, " ") || "Packaging Design"}
                                        </span>
                                        <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-1">
                                            {gig.title}
                                        </h3>
                                    </div>

                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {gig.description}
                                    </p>

                                    {/* Packages snippet */}
                                    <div className="flex flex-wrap gap-1">
                                        {(gig.packages && gig.packages.length > 0
                                            ? gig.packages
                                            : [{ tier: "basic", price: String(gig.price) }]
                                        ).map((pkg) => (
                                            <span
                                                key={pkg.tier}
                                                className="rounded-md border border-border/50 bg-secondary/40 px-2 py-0.5 text-[10px] font-semibold text-foreground capitalize"
                                            >
                                                {pkg.tier}: ₹{Number(pkg.price).toLocaleString("en-IN")}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock3 className="size-3 text-blue-500" />
                                                {turnaround}d
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <RotateCcw className="size-3 text-blue-500" />
                                                {revisions === -1 ? "∞" : revisions}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(gig)}
                                                className="text-xs h-7.5 px-2.5"
                                            >
                                                Edit
                                            </Button>
                                            {gig.slug && gig.status === "published" && (
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs h-7.5 px-2"
                                                >
                                                    <Link href={`/business/designers/${gig.slug}`}>
                                                        <ExternalLink className="size-3.5" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center space-y-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                        <BriefcaseBusiness className="size-6" />
                    </div>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                        You have not published any gigs yet
                    </h3>
                    <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
                        Publish Fiverr-style packaging gigs with tiered packages (Basic, Standard, Premium), dieline guarantees, and 3D mockups.
                    </p>
                    <Button onClick={handleCreateNew} className="text-xs gap-1.5 mt-2">
                        <Plus className="size-4" />
                        <span>Create Your First Gig</span>
                    </Button>
                </div>
            )}

            {/* Gig Editor Modal */}
            <GigEditorDialog
                open={editorOpen}
                onOpenChange={setEditorOpen}
                initialGig={editingGig}
                hasBio={hasBio}
                hasSpecialization={hasSpecialization}
            />
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmGig} onOpenChange={(open) => !open && setDeleteConfirmGig(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete gig</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{deleteConfirmGig?.title}&rdquo;? Active and completed client orders will not be affected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirmGig(null)} disabled={loadingId !== null}>Cancel</Button>
                        <Button variant="destructive" size="sm" disabled={loadingId !== null} onClick={confirmDelete}>
                            {loadingId ? <Loader2 className="size-3.5 animate-spin" /> : "Delete gig"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}

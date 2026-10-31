"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    AlertCircle,
    ArrowLeft,
    ArrowUpRight,
    Check,
    CheckCircle2,
    Clock3,
    Download,
    ExternalLink,
    FileCheck2,
    FileText,
    History,
    Info,
    Layers,
    Link as LinkIcon,
    Loader2,
    MessageSquare,
    Package,
    Paperclip,
    RotateCcw,
    Send,
    Sparkles,
    Star,
    UploadCloud,
    User,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import {
    respondToDesignRequestAction,
    deliverDesignWorkAction,
    respondToDeliveryAction,
    cancelOrderAction,
    sendOrderMessageAction,
    submitDesignerReviewAction,
    replyToReviewAction,
    attachArtworkToOrderAction,
} from "@/actions/hired-service-orders"

import {
    HIRED_SERVICE_STATUS_LABELS,
    HIRED_SERVICE_STATUS_COLORS,
    ORDER_STEP_SEQUENCE,
    getDeadlineInfo,
    type HiredServiceStatus,
} from "@/lib/hired-services/lifecycle"

import type {
    BusinessHiredService,
    HiredServiceDelivery,
    HiredServiceEvent,
    HiredServiceMessage,
    DesignerReview,
} from "@/lib/db/schema/business-hired-service"

export interface WorkspaceData {
    order: BusinessHiredService
    business: {
        id: string
        name: string | null
        owner: string | null
        email: string | null
        phone: string | null
        address: string | null
        userId: string | null
    }
    designer: {
        id: string | null
        name: string | null
        email: string | null
        phone: string | null
        photo: string | null
        userId: string | null
    }
    gig: {
        title: string
        slug: string | null
        images: string[]
    }
    role: "business" | "designer"
    messages: HiredServiceMessage[]
    deliveries: HiredServiceDelivery[]
    events: HiredServiceEvent[]
    review: DesignerReview | null
}

export function HiredServiceWorkspace({ data }: { data: WorkspaceData }) {
    const router = useRouter()
    const { order, business: biz, designer: des, gig, role, deliveries, events, review } = data
    const [isPending, startTransition] = useTransition()

    const [activeTab, setActiveTab] = useState<"brief" | "messages" | "deliveries" | "timeline" | "review">("brief")

    // Modals state
    const [declineOpen, setDeclineOpen] = useState(false)
    const [declineReason, setDeclineReason] = useState("")

    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState("")

    const [deliverOpen, setDeliverOpen] = useState(false)
    const [deliveryFilesText, setDeliveryFilesText] = useState("")
    const [deliveryPreviewUrl, setDeliveryPreviewUrl] = useState("")
    const [deliveryNote, setDeliveryNote] = useState("")

    const [revisionOpen, setRevisionOpen] = useState(false)
    const [revisionNotes, setRevisionNotes] = useState("")

    const [reviewOpen, setReviewOpen] = useState(false)
    const [rating, setRating] = useState(5)
    const [commRating, setCommRating] = useState(5)
    const [qualRating, setQualRating] = useState(5)
    const [asDescRating, setAsDescRating] = useState(5)
    const [reviewText, setReviewText] = useState("")

    const [replyOpen, setReplyOpen] = useState(false)
    const [replyText, setReplyText] = useState("")

    const [attachOpen, setAttachOpen] = useState(false)
    const [orderIdToAttach, setOrderIdToAttach] = useState("")

    // Chat input
    const [messageInput, setMessageInput] = useState("")
    const [messageAttachment, setMessageAttachment] = useState("")

    // TanStack Query for polling messages every 15 seconds
    const { data: messagesData, refetch: refetchMessages } = useQuery({
        queryKey: ["order-messages", order.id],
        queryFn: async () => {
            const res = await fetch(`/api/orders/${order.id}/messages`)
            if (!res.ok) throw new Error("Failed to fetch messages")
            const json = await res.json()
            return json.messages as HiredServiceMessage[]
        },
        initialData: data.messages,
        refetchInterval: 15000,
    })

    const messages = messagesData || data.messages
    const status = order.status as HiredServiceStatus
    const deadline = getDeadlineInfo(order.dueAt)
    const priceFormatted = Number(order.price).toLocaleString("en-IN")

    // Brief parsed
    const brief = order.brief || {}
    const extras = (order.extras as { name: string; price: number; extraDays: number }[]) || []

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    const handleAcceptRequest = () => {
        startTransition(async () => {
            const res = await respondToDesignRequestAction({ orderId: order.id, action: "accept" })
            if (res.success) {
                toast.success("Order accepted")
                router.refresh()
            } else {
                toast.error("Couldn't accept order")
            }
        })
    }

    const handleDeclineRequest = () => {
        if (!declineReason.trim()) {
            toast.error("Please provide a decline reason.")
            return
        }
        startTransition(async () => {
            const res = await respondToDesignRequestAction({
                orderId: order.id,
                action: "decline",
                declineReason,
            })
            if (res.success) {
                toast.success("Order declined")
                setDeclineOpen(false)
                router.refresh()
            } else {
                toast.error("Couldn't decline order")
            }
        })
    }

    const handleDeliverWork = () => {
        const fileUrls = deliveryFilesText
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)

        if (fileUrls.length === 0) {
            toast.error("Please provide at least one downloadable file URL.")
            return
        }
        if (!deliveryNote.trim()) {
            toast.error("Please include a note for the client.")
            return
        }

        startTransition(async () => {
            const res = await deliverDesignWorkAction({
                orderId: order.id,
                files: fileUrls,
                previewUrl: deliveryPreviewUrl.trim() || undefined,
                designerNote: deliveryNote.trim(),
            })
            if (res.success) {
                toast.success("Deliverables submitted")
                setDeliverOpen(false)
                setActiveTab("deliveries")
                router.refresh()
            } else {
                toast.error("Couldn't submit deliverables")
            }
        })
    }

    const handleAcceptDelivery = () => {
        startTransition(async () => {
            const res = await respondToDeliveryAction({ orderId: order.id, action: "accept" })
            if (res.success) {
                toast.success("Delivery accepted")
                setReviewOpen(true)
                router.refresh()
            } else {
                toast.error("Couldn't accept delivery")
            }
        })
    }

    const handleRequestRevision = () => {
        if (!revisionNotes.trim()) {
            toast.error("Please explain the revisions needed.")
            return
        }
        startTransition(async () => {
            const res = await respondToDeliveryAction({
                orderId: order.id,
                action: "revision",
                revisionNotes,
            })
            if (res.success) {
                toast.success("Revision requested")
                setRevisionOpen(false)
                router.refresh()
            } else {
                toast.error("Couldn't request revision")
            }
        })
    }

    const handleCancelOrder = () => {
        if (!cancelReason.trim()) {
            toast.error("A cancellation reason is required.")
            return
        }
        startTransition(async () => {
            const res = await cancelOrderAction({ orderId: order.id, reason: cancelReason })
            if (res.success) {
                toast.success("Order cancelled")
                setCancelOpen(false)
                router.refresh()
            } else {
                toast.error("Couldn't cancel order")
            }
        })
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!messageInput.trim()) return

        const text = messageInput.trim()
        const attach = messageAttachment.trim() ? [messageAttachment.trim()] : []
        setMessageInput("")
        setMessageAttachment("")

        const res = await sendOrderMessageAction({
            orderId: order.id,
            body: text,
            attachments: attach,
        })
        if (!res.success) {
            toast.error("Couldn't send message")
        } else {
            refetchMessages()
        }
    }

    const handleSubmitReview = () => {
        if (!reviewText.trim()) {
            toast.error("Please add a short review text.")
            return
        }
        startTransition(async () => {
            const res = await submitDesignerReviewAction({
                orderId: order.id,
                rating,
                communicationRating: commRating,
                qualityRating: qualRating,
                asDescribedRating: asDescRating,
                text: reviewText.trim(),
            })
            if (res.success) {
                toast.success("Review submitted")
                setReviewOpen(false)
                setActiveTab("review")
                router.refresh()
            } else {
                toast.error("Couldn't submit review")
            }
        })
    }

    const handleReplyToReview = () => {
        if (!replyText.trim() || !review?.id) return
        startTransition(async () => {
            const res = await replyToReviewAction({
                reviewId: review.id,
                replyText: replyText.trim(),
            })
            if (res.success) {
                toast.success("Reply posted")
                setReplyOpen(false)
                router.refresh()
            } else {
                toast.error("Couldn't post reply")
            }
        })
    }

    const handleAttachArtwork = () => {
        if (!orderIdToAttach.trim()) {
            toast.error("Please provide a packaging production order ID.")
            return
        }
        startTransition(async () => {
            const res = await attachArtworkToOrderAction({
                hiredServiceId: order.id,
                businessOrderId: orderIdToAttach.trim(),
            })
            if (res.success) {
                toast.success("Artwork attached")
                setAttachOpen(false)
                router.refresh()
            } else {
                toast.error("Couldn't attach artwork")
            }
        })
    }

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-6">
            {/* Top Back Nav & Quick Breadcrumb */}
            <div className="flex items-center justify-between">
                <Link
                    href={role === "designer" ? "/designer/orders" : "/business/hired-services"}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to {role === "designer" ? "Client Orders" : "Hired Services"}</span>
                </Link>
                <span className="font-mono text-xs text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</span>
            </div>

            {/* Offline Payment Notice Banner */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-3">
                <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-0.5 leading-relaxed">
                    <p className="font-semibold">Payment arranged directly</p>
                    <p>
                        Payment is arranged directly between you and the {role === "designer" ? "client" : "designer"}. Online payments are not connected yet. No commission fees are deducted.
                    </p>
                </div>
            </div>

            {/* Header Card */}
            <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${HIRED_SERVICE_STATUS_COLORS[status]}`}>
                                {HIRED_SERVICE_STATUS_LABELS[status] || status}
                            </span>
                            {order.packageTier && (
                                <Badge variant="secondary" className="capitalize text-xs font-medium">
                                    {order.packageTier} Package
                                </Badge>
                            )}
                            {order.revisionsIncluded !== undefined && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                                    <RotateCcw className="size-3" />
                                    Revisions: {order.revisionsUsed} / {order.revisionsIncluded === -1 ? "∞" : order.revisionsIncluded} used
                                </span>
                            )}
                        </div>

                        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground truncate">
                            {order.serviceTitle}
                        </h1>

                        <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                                {role === "designer" ? "Client: " : "Designer: "}
                                <strong className="font-semibold text-foreground">
                                    {role === "designer" ? biz.name : des.name}
                                </strong>
                            </span>
                            <span>·</span>
                            <span>Placed {new Date(order.hiredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                    </div>

                    {/* Price & Deadline box */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t lg:border-t-0 pt-3 lg:pt-0">
                        <div className="text-left lg:text-right">
                            <div className="text-xs text-muted-foreground">Agreed Order Value</div>
                            <div className="font-heading text-2xl font-bold text-foreground">₹{priceFormatted}</div>
                        </div>

                        <div className="text-left lg:text-right">
                            <div className="text-xs text-muted-foreground">Delivery Timeline</div>
                            <div className={`font-semibold text-sm flex items-center gap-1.5 ${deadline.isLate ? "text-rose-500 font-bold" : "text-foreground"}`}>
                                <Clock3 className="size-3.5" />
                                <span>{deadline.label}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4-Step Visual Stepper */}
                <div className="border-t border-border/40 pt-5">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {ORDER_STEP_SEQUENCE.map((step, idx) => {
                            const stepIdx = ORDER_STEP_SEQUENCE.indexOf(status as any)
                            const isCompleted = stepIdx > idx || status === "completed" || status === "closed"
                            const isCurrent = (status === step) || (step === "active" && status === "revision_requested")

                            return (
                                <div key={step} className="flex flex-col items-center gap-1.5">
                                    <div
                                        className={`flex size-6 sm:size-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                            isCompleted
                                                ? "bg-emerald-600 text-white"
                                                : isCurrent
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {isCompleted ? <Check className="size-3.5" /> : idx + 1}
                                    </div>
                                    <span className={`text-[11px] sm:text-xs truncate max-w-full ${isCurrent ? "font-semibold text-blue-500" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                                        {HIRED_SERVICE_STATUS_LABELS[step]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Contextual Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4 bg-muted/20 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-2xl">
                    <div className="text-xs text-muted-foreground">
                        {status === "requested" && (role === "designer" ? "Accept this brief to start work." : "Awaiting designer acceptance (within 48h).")}
                        {status === "active" && (role === "designer" ? "Work in progress. Deliver finished artwork files when ready." : "Designer is currently crafting your artwork.")}
                        {status === "delivered" && (role === "business" ? "Review the submitted files below. Accept or request revisions." : "Delivery submitted. Awaiting client review.")}
                        {status === "revision_requested" && (role === "designer" ? "Client requested revisions. Check notes in deliveries tab." : "Awaiting revised delivery from designer.")}
                        {status === "completed" && "Project completed! Artwork ready for vendor quotes."}
                        {status === "declined" && `Request was declined. Reason: ${order.cancelReason || "Unavailable"}`}
                        {status === "cancelled" && `Order cancelled. Reason: ${order.cancelReason || "Cancelled"}`}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Designer actions on Requested */}
                        {role === "designer" && status === "requested" && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeclineOpen(true)}
                                    disabled={isPending}
                                    className="text-xs text-rose-500 hover:text-rose-600 border-rose-500/30"
                                >
                                    Decline Request
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAcceptRequest}
                                    disabled={isPending}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
                                >
                                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                    <span>Accept & Start Work</span>
                                </Button>
                            </>
                        )}

                        {/* Designer actions on Active or Revision Requested */}
                        {role === "designer" && (status === "active" || status === "revision_requested") && (
                            <Button
                                size="sm"
                                onClick={() => setDeliverOpen(true)}
                                disabled={isPending}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
                            >
                                <UploadCloud className="size-3.5" />
                                <span>Deliver Artwork</span>
                            </Button>
                        )}

                        {/* Business actions on Requested */}
                        {role === "business" && status === "requested" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCancelOpen(true)}
                                disabled={isPending}
                                className="text-xs text-destructive hover:bg-destructive/10"
                            >
                                Cancel Request
                            </Button>
                        )}

                        {/* Business actions on Delivered */}
                        {role === "business" && status === "delivered" && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRevisionOpen(true)}
                                    disabled={isPending}
                                    className="text-xs gap-1.5"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Request Revision</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAcceptDelivery}
                                    disabled={isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                                >
                                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                    <span>Accept Delivery</span>
                                </Button>
                            </>
                        )}

                        {/* Business actions on Completed */}
                        {role === "business" && status === "completed" && (
                            <>
                                {!review && (
                                    <Button
                                        size="sm"
                                        onClick={() => setReviewOpen(true)}
                                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1.5"
                                    >
                                        <Star className="size-3.5" />
                                        <span>Leave Review</span>
                                    </Button>
                                )}
                                {!order.linkedOrderId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAttachOpen(true)}
                                        className="text-xs gap-1.5"
                                    >
                                        <LinkIcon className="size-3.5" />
                                        <span>Attach to Production Order</span>
                                    </Button>
                                )}
                            </>
                        )}

                        {/* Designer reply on completed review */}
                        {role === "designer" && status === "completed" && review && !review.designerReply && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReplyOpen(true)}
                                className="text-xs gap-1.5"
                            >
                                <MessageSquare className="size-3.5" />
                                <span>Reply to Review</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto text-xs font-medium">
                <button
                    type="button"
                    onClick={() => setActiveTab("brief")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                        activeTab === "brief"
                            ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                    <FileText className="size-3.5 text-blue-500" />
                    <span>Project Brief</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("messages")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                        activeTab === "messages"
                            ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                    <MessageSquare className="size-3.5 text-blue-500" />
                    <span>Conversation</span>
                    {messages.length > 0 && (
                        <span className="rounded-full bg-blue-500/15 px-1.5 py-0.2 text-[10px] font-bold text-blue-500">
                            {messages.length}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("deliveries")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                        activeTab === "deliveries"
                            ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                    <FileCheck2 className="size-3.5 text-emerald-500" />
                    <span>Deliveries</span>
                    {deliveries.length > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-500">
                            v{deliveries[0]?.versionNumber || 1}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("timeline")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                        activeTab === "timeline"
                            ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                    <History className="size-3.5 text-muted-foreground" />
                    <span>Timeline ({events.length})</span>
                </button>

                {review && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("review")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                            activeTab === "review"
                                ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        <Star className="size-3.5 text-amber-500 fill-amber-500" />
                        <span>Client Review</span>
                    </button>
                )}
            </div>

            {/* TAB 1: Project Brief */}
            {activeTab === "brief" && (
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
                            <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                                <FileText className="size-4 text-blue-500" />
                                <span>Packaging Brief & Specifications</span>
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2 text-xs">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Packaging Type</span>
                                    <p className="font-medium text-foreground">{brief.packagingType || "Not specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Dimensions</span>
                                    <p className="font-medium text-foreground">{brief.dimensions || "Not specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Material Specs</span>
                                    <p className="font-medium text-foreground">{brief.material || "Not specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Brand Name & Tagline</span>
                                    <p className="font-medium text-foreground">
                                        {brief.brandName || "Brand"} {brief.tagline ? `— "${brief.tagline}"` : ""}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Colours & Fonts Preference</span>
                                    <p className="font-medium text-foreground">{brief.colours || "Open to designer recommendation"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Dieline Status</span>
                                    <p className="font-medium text-foreground capitalize">
                                        {brief.dieline === "provided" ? "Dieline provided by business" : "Designer needs to create structural dieline"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Required Formats</span>
                                    <p className="font-medium text-foreground">{brief.formats || "Print-ready vector PDF / AI"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Target Completion</span>
                                    <p className="font-medium text-foreground">{brief.deadline || "Standard delivery"}</p>
                                </div>
                            </div>

                            {brief.targetAudience && (
                                <div className="space-y-1 pt-2 border-t border-border/40 text-xs">
                                    <span className="text-muted-foreground">Target Audience & Brand Positioning</span>
                                    <p className="leading-relaxed text-foreground">{brief.targetAudience}</p>
                                </div>
                            )}

                            {brief.referenceLinks && (
                                <div className="space-y-1 pt-2 border-t border-border/40 text-xs">
                                    <span className="text-muted-foreground">Inspiration & Reference Links</span>
                                    <p className="break-all font-mono text-[11px] text-blue-500">
                                        {brief.referenceLinks}
                                    </p>
                                </div>
                            )}

                            {brief.notes && (
                                <div className="space-y-1 pt-2 border-t border-border/40 text-xs">
                                    <span className="text-muted-foreground">Additional Notes</span>
                                    <p className="leading-relaxed text-foreground">{brief.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Snapshot details */}
                    <div className="space-y-4">
                        <div className="rounded-xl border border-border/60 bg-card p-5 text-xs space-y-4 shadow-xs">
                            <h3 className="font-heading font-semibold text-foreground">Package Scope</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Package</span>
                                    <span className="font-semibold text-foreground capitalize">{order.packageName || order.packageTier || "Standard"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Base Delivery</span>
                                    <span className="text-foreground">{order.deliveryDays} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Revisions</span>
                                    <span className="text-foreground">{order.revisionsIncluded === -1 ? "Unlimited" : `${order.revisionsIncluded} included`}</span>
                                </div>
                            </div>

                            {extras.length > 0 && (
                                <div className="pt-2 border-t border-border/40 space-y-1.5">
                                    <span className="font-semibold text-foreground">Gig Extras</span>
                                    {extras.map((extra, idx) => (
                                        <div key={idx} className="flex justify-between text-muted-foreground text-[11px]">
                                            <span>{extra.name}</span>
                                            <span>₹{extra.price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-2 border-t border-border/40 flex justify-between font-semibold text-sm">
                                <span>Total Value</span>
                                <span className="text-blue-500">₹{priceFormatted}</span>
                            </div>
                        </div>

                        {/* Counterparty card */}
                        <div className="rounded-xl border border-border/60 bg-card p-5 text-xs space-y-3 shadow-xs">
                            <h3 className="font-heading font-semibold text-foreground">
                                {role === "designer" ? "Client Contact" : "Designer Contact"}
                            </h3>
                            <div className="space-y-1">
                                <p className="font-medium text-foreground">{role === "designer" ? biz.name : des.name}</p>
                                <p className="font-mono text-[11px] text-muted-foreground">{role === "designer" ? biz.email : des.email}</p>
                                <p className="text-muted-foreground">{role === "designer" ? biz.phone : des.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Conversation */}
            {activeTab === "messages" && (
                <div className="rounded-xl border border-border/60 bg-card shadow-xs flex flex-col h-[580px]">
                    {/* Header */}
                    <div className="p-4 border-b border-border/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-semibold text-foreground">Direct Collaboration Thread</span>
                        </div>
                        <span className="text-muted-foreground text-[11px]">Auto-refreshes every 15s</span>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground space-y-2">
                                <MessageSquare className="size-8 text-muted-foreground/40" />
                                <p>No messages yet in this project workspace.</p>
                                <p className="text-[11px]">Ask questions, provide clarifications, or discuss project nuances here.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = (role === "business" && msg.senderId === biz.userId) ||
                                             (role === "designer" && msg.senderId === des.userId)
                                const senderName = isMe ? "You" : role === "business" ? des.name : biz.name

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <span className="text-[10px] text-muted-foreground mb-1 px-1">
                                            {senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        <div
                                            className={`max-w-[75%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-br-xs"
                                                    : "bg-muted text-foreground rounded-bl-xs border border-border/50"
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.body}</p>
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 pt-1 border-t border-white/20 space-y-1 text-[11px]">
                                                    {msg.attachments.map((att, aIdx) => (
                                                        <a
                                                            key={aIdx}
                                                            href={att}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 underline underline-offset-2 break-all"
                                                        >
                                                            <Paperclip className="size-3 shrink-0" />
                                                            <span>Attachment {aIdx + 1}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Chat Footer Input */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 bg-muted/20 space-y-2">
                        <div className="flex gap-2">
                            <Input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message to discuss dielines, artwork, or revisions..."
                                className="text-xs h-9 bg-background"
                            />
                            <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-3 gap-1">
                                <Send className="size-3.5" />
                                <span className="hidden sm:inline">Send</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <Paperclip className="size-3 text-muted-foreground" />
                            <input
                                type="url"
                                value={messageAttachment}
                                onChange={(e) => setMessageAttachment(e.target.value)}
                                placeholder="Optional attachment URL (e.g. Figma / Google Drive link)"
                                className="w-full bg-transparent text-muted-foreground text-[11px] outline-none placeholder:text-muted-foreground/60"
                            />
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 3: Deliveries */}
            {activeTab === "deliveries" && (
                <div className="space-y-4">
                    {deliveries.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/60 bg-card p-10 text-center text-xs text-muted-foreground space-y-3">
                            <UploadCloud className="size-10 mx-auto text-muted-foreground/40" />
                            <h3 className="font-heading text-base font-semibold text-foreground">No Deliveries Submitted Yet</h3>
                            <p className="max-w-md mx-auto">
                                When the designer finishes the artwork, versioned downloadable files (AI, PDF, EPS, 3D renders) will be listed here.
                            </p>
                            {role === "designer" && (
                                <Button
                                    size="sm"
                                    onClick={() => setDeliverOpen(true)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
                                >
                                    <UploadCloud className="size-3.5" />
                                    <span>Submit First Delivery</span>
                                </Button>
                            )}
                        </div>
                    ) : (
                        deliveries.map((del) => (
                            <div key={del.id} className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-600 text-white text-xs">Version {del.versionNumber}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Submitted {new Date(del.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>

                                    {del.versionNumber === deliveries[0]?.versionNumber && status === "delivered" && role === "business" && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setRevisionOpen(true)}
                                                className="text-xs gap-1"
                                            >
                                                <RotateCcw className="size-3" />
                                                Request Changes
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleAcceptDelivery}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                                            >
                                                <CheckCircle2 className="size-3" />
                                                Accept This Version
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {del.designerNote && (
                                    <div className="text-xs space-y-1">
                                        <span className="font-semibold text-foreground">Designer Note:</span>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{del.designerNote}</p>
                                    </div>
                                )}

                                {del.previewUrl && (
                                    <div className="space-y-1 pt-2">
                                        <span className="text-xs font-semibold text-foreground">Mockup Preview</span>
                                        <div className="relative aspect-video max-h-64 rounded-xl overflow-hidden border border-border/50 bg-muted">
                                            <Image
                                                src={del.previewUrl}
                                                alt={`Version ${del.versionNumber} preview`}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pt-2 border-t border-border/40">
                                    <span className="text-xs font-semibold text-foreground">Downloadable Deliverables</span>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {del.files.map((fileUrl, fIdx) => (
                                            <a
                                                key={fIdx}
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs hover:bg-muted transition-colors group"
                                            >
                                                <div className="flex items-center gap-2 truncate min-w-0">
                                                    <FileCheck2 className="size-4 text-emerald-500 shrink-0" />
                                                    <span className="truncate font-mono text-[11px] text-foreground">{fileUrl}</span>
                                                </div>
                                                <Download className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB 4: Timeline / Events */}
            {activeTab === "timeline" && (
                <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-5">
                    <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                        <History className="size-4 text-muted-foreground" />
                        <span>Audit Trail & Event Log</span>
                    </h2>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                        {events.map((evt) => (
                            <div key={evt.id} className="relative space-y-1 text-xs">
                                <div className="absolute -left-6 top-1 size-2 rounded-full bg-blue-500 ring-4 ring-background" />
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground capitalize">
                                        {HIRED_SERVICE_STATUS_LABELS[evt.status as HiredServiceStatus] || evt.status.replace("_", " ")}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        by {evt.actorRole || "system"} · {new Date(evt.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                                {evt.note && <p className="text-muted-foreground text-[11px] leading-relaxed">{evt.note}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: Review */}
            {activeTab === "review" && review && (
                <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`size-4 ${star <= review.rating ? "fill-amber-500" : "text-muted-foreground/30"}`}
                                    />
                                ))}
                                <span className="font-bold text-sm ml-1 text-foreground">{review.rating}.0</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Verified Business Review by {biz.name}
                            </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 p-3 rounded-xl bg-muted/30 text-xs">
                        <div>
                            <span className="text-muted-foreground">Communication</span>
                            <p className="font-semibold text-foreground">{review.communicationRating} / 5</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Artwork Quality</span>
                            <p className="font-semibold text-foreground">{review.qualityRating} / 5</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">As Described</span>
                            <p className="font-semibold text-foreground">{review.asDescribedRating} / 5</p>
                        </div>
                    </div>

                    {review.text && (
                        <p className="text-xs leading-relaxed text-foreground italic">
                            &ldquo;{review.text}&rdquo;
                        </p>
                    )}

                    {/* Designer Reply */}
                    {review.designerReply ? (
                        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1 text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <MessageSquare className="size-3 text-blue-500" />
                                Designer Response from {des.name}
                            </span>
                            <p className="text-muted-foreground leading-relaxed">{review.designerReply}</p>
                        </div>
                    ) : role === "designer" ? (
                        <div className="pt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReplyOpen(true)}
                                className="text-xs gap-1"
                            >
                                <MessageSquare className="size-3" />
                                Post Public Reply
                            </Button>
                        </div>
                    ) : null}
                </div>
            )}

            {/* MODAL 1: Decline Dialog */}
            <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Decline Project Request</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Please explain why you cannot accept this project right now so the business can adjust their brief.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <Textarea
                            rows={3}
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="e.g. Schedule is currently fully booked, or outside my packaging specialization..."
                            className="text-xs"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setDeclineOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending}
                            onClick={handleDeclineRequest}
                            className="text-xs gap-1"
                        >
                            {isPending && <Loader2 className="size-3 animate-spin" />}
                            Confirm Decline
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: Cancel Order Dialog */}
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Cancel Design Request</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Are you sure you want to cancel this request? Cancellation reason will be recorded on the timeline.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <Textarea
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            className="text-xs"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setCancelOpen(false)} className="text-xs">
                            Keep Order
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending}
                            onClick={handleCancelOrder}
                            className="text-xs gap-1"
                        >
                            {isPending && <Loader2 className="size-3 animate-spin" />}
                            Cancel Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: Deliver Work Dialog */}
            <Dialog open={deliverOpen} onOpenChange={setDeliverOpen}>
                <DialogContent className="max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <UploadCloud className="size-4 text-blue-500" />
                            <span>Deliver Artwork Files</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Upload your finished packaging files (vector dielines, print PDFs, high-res renders) and provide the download links.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Downloadable File URLs (one per line, HTTPS)
                            </label>
                            <Textarea
                                rows={3}
                                value={deliveryFilesText}
                                onChange={(e) => setDeliveryFilesText(e.target.value)}
                                placeholder={"https://drive.google.com/file/d/dieline.pdf\nhttps://wetransfer.com/downloads/package_art.zip"}
                                className="text-xs font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Visual Mockup Preview URL (optional, image link)
                            </label>
                            <Input
                                value={deliveryPreviewUrl}
                                onChange={(e) => setDeliveryPreviewUrl(e.target.value)}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Delivery Note & Specifications
                            </label>
                            <Textarea
                                rows={3}
                                value={deliveryNote}
                                onChange={(e) => setDeliveryNote(e.target.value)}
                                placeholder="Details about bleed margins, spot UV layers, and print instructions..."
                                className="text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setDeliverOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isPending}
                            onClick={handleDeliverWork}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1"
                        >
                            {isPending && <Loader2 className="size-3 animate-spin" />}
                            Submit Delivery
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: Revision Request Dialog */}
            <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <RotateCcw className="size-4 text-blue-500" />
                            <span>Request Revision</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {order.revisionsIncluded === -1
                                ? "You have unlimited revisions included."
                                : `Revision ${order.revisionsUsed + 1} of ${order.revisionsIncluded} included in your package.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <Textarea
                            rows={4}
                            value={revisionNotes}
                            onChange={(e) => setRevisionNotes(e.target.value)}
                            placeholder="Describe specific tweaks to fonts, colors, positioning, or dieline dimensions..."
                            className="text-xs"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setRevisionOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isPending}
                            onClick={handleRequestRevision}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1"
                        >
                            {isPending && <Loader2 className="size-3 animate-spin" />}
                            Send Revision Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 5: Leave Review Dialog */}
            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Star className="size-4 text-amber-500 fill-amber-500" />
                            <span>Review {des.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Rate your experience with this packaging project. Reviews help other F&B brands make confident hiring decisions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">Overall Rating</span>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="text-amber-500 transition-colors"
                                    >
                                        <Star className={`size-5 ${star <= rating ? "fill-amber-500" : "text-muted-foreground/30"}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">Communication</label>
                                <select
                                    value={commRating}
                                    onChange={(e) => setCommRating(Number(e.target.value))}
                                    className="w-full h-8 rounded-lg border border-border/60 bg-background px-2 text-xs text-foreground"
                                >
                                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">Artwork Quality</label>
                                <select
                                    value={qualRating}
                                    onChange={(e) => setQualRating(Number(e.target.value))}
                                    className="w-full h-8 rounded-lg border border-border/60 bg-background px-2 text-xs text-foreground"
                                >
                                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">As Described</label>
                                <select
                                    value={asDescRating}
                                    onChange={(e) => setAsDescRating(Number(e.target.value))}
                                    className="w-full h-8 rounded-lg border border-border/60 bg-background px-2 text-xs text-foreground"
                                >
                                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Review Feedback</label>
                            <Textarea
                                rows={3}
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Describe the designer's speed, dieline accuracy, and creativity..."
                                className="text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setReviewOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isPending}
                            onClick={handleSubmitReview}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1"
                        >
                            {isPending && <Loader2 className="size-3 animate-spin" />}
                            Submit Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 6: Reply to Review Dialog */}
            <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Reply to Client Review</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Your reply will be displayed publicly under the review on your service page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <Textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Thank the client for the collaboration..."
                            className="text-xs"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setReplyOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isPending}
                            onClick={handleReplyToReview}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1"
                        >
                            {isPending && <Loader2 className="size-3 animate-spin" />}
                            Post Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 7: Attach Artwork to Order Dialog */}
            <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <LinkIcon className="size-4 text-blue-500" />
                            <span>Attach to Packaging Order</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Connect this finished dieline design to a production order so the manufacturer receives print-ready artwork.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-medium text-foreground">Packaging Order UUID</label>
                        <Input
                            value={orderIdToAttach}
                            onChange={(e) => setOrderIdToAttach(e.target.value)}
                            placeholder="e.g. b8c92a10-..."
                            className="text-xs font-mono"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setAttachOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isPending}
                            onClick={handleAttachArtwork}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1"
                        >
                            {isPending && <Loader2 className="size-3 animate-spin" />}
                            Link Artwork
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


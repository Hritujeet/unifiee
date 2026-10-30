export const HIRED_SERVICE_STATUSES = [
    "requested",
    "active",
    "delivered",
    "revision_requested",
    "completed",
    "declined",
    "cancelled",
    "expired",
    "closed",
] as const

export type HiredServiceStatus = (typeof HIRED_SERVICE_STATUSES)[number]
export type HiredServiceRole = "business" | "designer" | "system"

export const HIRED_SERVICE_STATUS_LABELS: Record<HiredServiceStatus, string> = {
    requested: "Requested",
    active: "In Progress",
    delivered: "Delivered",
    revision_requested: "Revision Requested",
    completed: "Completed",
    declined: "Declined",
    cancelled: "Cancelled",
    expired: "Expired",
    closed: "Closed (Auto-Completed)",
}

export const HIRED_SERVICE_STATUS_COLORS: Record<HiredServiceStatus, string> = {
    requested: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    active: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    delivered: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    revision_requested: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    declined: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
    expired: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    closed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

export const allowedTransitions: Record<HiredServiceRole, Partial<Record<HiredServiceStatus, readonly HiredServiceStatus[]>>> = {
    business: {
        requested: ["cancelled"],
        delivered: ["completed", "revision_requested"],
        active: ["cancelled"], // Can request cancellation
    },
    designer: {
        requested: ["active", "declined"],
        active: ["delivered"],
        revision_requested: ["active", "delivered"],
    },
    system: {
        requested: ["expired"], // 48h timeout
        delivered: ["completed", "closed"], // 3d auto-complete
    },
}

export function canTransition(
    from: HiredServiceStatus,
    to: HiredServiceStatus,
    role: HiredServiceRole
): boolean {
    if (from === to) return true
    return allowedTransitions[role][from]?.includes(to) ?? false
}

export const ORDER_STEP_SEQUENCE: readonly HiredServiceStatus[] = [
    "requested",
    "active",
    "delivered",
    "completed",
]

/**
 * Lazy evaluation for orders:
 * - If in 'requested' state and > 48h since placed -> expired
 * - If in 'delivered' state and > 72h (3 days) since last delivery -> completed / closed
 */
export function evaluateAutoTransitions(order: {
    status: HiredServiceStatus
    hiredAt: Date | string
    deliveredAt?: Date | string | null
    updatedAt?: Date | string
}): { shouldTransition: boolean; newStatus: HiredServiceStatus; reason: string } {
    const now = Date.now()

    if (order.status === "requested") {
        const placedTime = new Date(order.hiredAt).getTime()
        const fortyEightHoursMs = 48 * 60 * 60 * 1000
        if (now - placedTime > fortyEightHoursMs) {
            return {
                shouldTransition: true,
                newStatus: "expired",
                reason: "Designer did not respond within 48 hours",
            }
        }
    }

    if (order.status === "delivered") {
        const deliveredTime = new Date(order.deliveredAt || order.updatedAt || order.hiredAt).getTime()
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000
        if (now - deliveredTime > threeDaysMs) {
            return {
                shouldTransition: true,
                newStatus: "completed",
                reason: "Auto-completed after 3 days without client response",
            }
        }
    }

    return { shouldTransition: false, newStatus: order.status, reason: "" }
}

/**
 * Calculates deadline status string and urgency
 */
export function getDeadlineInfo(dueAt: Date | string | null | undefined): {
    label: string
    isLate: boolean
    daysRemaining: number | null
} {
    if (!dueAt) return { label: "No due date set", isLate: false, daysRemaining: null }

    const due = new Date(dueAt).getTime()
    const now = Date.now()
    const diffMs = due - now
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffMs < 0) {
        const daysLate = Math.abs(diffDays)
        return {
            label: daysLate === 0 ? "Due today (Late soon)" : `Late by ${daysLate} day${daysLate === 1 ? "" : "s"}`,
            isLate: true,
            daysRemaining: diffDays,
        }
    }

    if (diffDays === 0) {
        return { label: "Due today", isLate: false, daysRemaining: 0 }
    }

    return {
        label: `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
        isLate: false,
        daysRemaining: diffDays,
    }
}


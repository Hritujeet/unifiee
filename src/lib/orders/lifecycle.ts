export const ORDER_STATUSES = [
    "placed",
    "confirmed",
    "proof_pending",
    "proof_approved",
    "in_production",
    "quality_check",
    "dispatched",
    "delivered",
    "completed",
    "cancelled",
    "rejected",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type OrderActor = "business" | "manufacturer" | "designer" | "system"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    placed: "Placed",
    confirmed: "Confirmed",
    proof_pending: "Proof pending",
    proof_approved: "Proof approved",
    in_production: "In production",
    quality_check: "Quality check",
    dispatched: "Dispatched",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    placed: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    confirmed: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    proof_pending: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    proof_approved: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    in_production: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    quality_check: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dispatched: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    completed: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    cancelled: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    rejected: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
}

export const allowedTransitions: Record<OrderActor, Partial<Record<OrderStatus, readonly OrderStatus[]>>> = {
    business: {
        placed: ["cancelled"],
        confirmed: ["proof_pending", "cancelled"],
        proof_pending: ["proof_approved", "cancelled"],
        proof_approved: ["cancelled"],
        in_production: [],
        quality_check: [],
        dispatched: [],
        delivered: ["completed"],
    },
    manufacturer: {
        placed: ["confirmed", "rejected", "cancelled"],
        confirmed: ["proof_pending", "cancelled"],
        proof_pending: ["proof_approved"],
        proof_approved: ["in_production"],
        in_production: ["quality_check"],
        quality_check: ["dispatched"],
        dispatched: ["delivered"],
    },
    designer: {},
    system: {
        placed: [],
        confirmed: [],
        proof_pending: [],
        proof_approved: [],
        in_production: [],
        quality_check: [],
        dispatched: [],
        delivered: [],
    },
}

export function canTransition(from: OrderStatus, to: OrderStatus, actor: OrderActor): boolean {
    if (from === to) return true
    return allowedTransitions[actor][from]?.includes(to) ?? false
}

export const ORDER_STATUS_SEQUENCE: readonly OrderStatus[] = [
    "placed",
    "confirmed",
    "proof_pending",
    "proof_approved",
    "in_production",
    "quality_check",
    "dispatched",
    "delivered",
    "completed",
]

/**
 * Single source of truth for client-facing order lifecycle stages.
 * Phase 2 Item 10: Unified stage model mapping backend/workflow states to client stages.
 */

export const CLIENT_STAGES = [
    "Requirement",
    "Offers",
    "Order Confirmed",
    "In Production",
    "Shipped",
    "Delivered",
] as const

export type ClientStage = (typeof CLIENT_STAGES)[number]

export const EXCEPTION_STAGES = ["Cancelled", "Rejected", "On Hold"] as const
export type ExceptionStage = (typeof EXCEPTION_STAGES)[number]

/**
 * Maps any backend or store status string to the canonical client-facing stage.
 * Note: QC (QUALITY_CHECK) is merged into "In Production" per pending decision.
 */
export function mapBackendToClientStage(status: string): ClientStage | ExceptionStage {
    const s = status.trim().toLowerCase().replace(/[-_]/g, " ")

    // Exception states
    if (s.includes("cancel")) return "Cancelled"
    if (s.includes("reject")) return "Rejected"
    if (s.includes("hold")) return "On Hold"

    // Requirement stage
    if (
        s === "requirement created" ||
        s === "requirement received" ||
        s === "matching" ||
        s === "draft" ||
        s === "submitted" ||
        s === "requirement"
    ) {
        return "Requirement"
    }

    // Offers stage
    if (
        s === "quote received" ||
        s === "quote accepted" ||
        s === "quoted" ||
        s === "offers" ||
        s === "offers in" ||
        s === "pending offer"
    ) {
        return "Offers"
    }

    // Order Confirmed stage
    if (
        s === "order confirmed" ||
        s === "confirmed" ||
        s === "awaiting proof" ||
        s === "proof pending"
    ) {
        return "Order Confirmed"
    }

    // In Production stage (merges QC / Quality Check per Item 10)
    if (
        s === "in production" ||
        s === "production" ||
        s === "quality check" ||
        s === "qc" ||
        s === "processing"
    ) {
        return "In Production"
    }

    // Shipped stage
    if (
        s === "shipped" ||
        s === "ready to ship" ||
        s === "out for delivery" ||
        s === "in transit"
    ) {
        return "Shipped"
    }

    // Delivered stage
    if (
        s === "delivered" ||
        s === "completed" ||
        s === "fulfilled"
    ) {
        return "Delivered"
    }

    // Safe fallback to Order Confirmed if unknown active order
    return "Order Confirmed"
}

/**
 * Returns 1-based index (1 to 6) for client progress bars, or 0 if exception stage.
 */
export function getClientStageIndex(status: string): number {
    const stage = mapBackendToClientStage(status)
    const idx = CLIENT_STAGES.indexOf(stage as ClientStage)
    return idx >= 0 ? idx + 1 : 0
}

/**
 * Checks whether status is an exception state (should render as separate badge outside progress bar)
 */
export function isExceptionStatus(status: string): boolean {
    const mapped = mapBackendToClientStage(status)
    return EXCEPTION_STAGES.includes(mapped as ExceptionStage)
}

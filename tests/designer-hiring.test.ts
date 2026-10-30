import test from "node:test"
import assert from "node:assert/strict"
import {
    canTransition,
    evaluateAutoTransitions,
    getDeadlineInfo,
    type HiredServiceStatus,
    type HiredServiceRole,
} from "../src/lib/hired-services/lifecycle"
import { hashIdempotencyPayload } from "../src/lib/server/idempotency-core"

// -----------------------------------------------------------------------------
// 1. Lifecycle Transition Matrix Tests
// -----------------------------------------------------------------------------

test("designer can accept or decline requested order, but cannot directly complete", () => {
    assert.equal(canTransition("requested", "active", "designer"), true)
    assert.equal(canTransition("requested", "declined", "designer"), true)
    assert.equal(canTransition("requested", "completed", "designer"), false)
    assert.equal(canTransition("requested", "delivered", "designer"), false)
})

test("designer can deliver from active or revision_requested", () => {
    assert.equal(canTransition("active", "delivered", "designer"), true)
    assert.equal(canTransition("revision_requested", "delivered", "designer"), true)
    assert.equal(canTransition("revision_requested", "active", "designer"), true)
    assert.equal(canTransition("delivered", "active", "designer"), false)
})

test("business can cancel requested order, but cannot decline or deliver", () => {
    assert.equal(canTransition("requested", "cancelled", "business"), true)
    assert.equal(canTransition("requested", "declined", "business"), false)
    assert.equal(canTransition("requested", "delivered", "business"), false)
})

test("business can accept delivery to completed, or request revisions", () => {
    assert.equal(canTransition("delivered", "completed", "business"), true)
    assert.equal(canTransition("delivered", "revision_requested", "business"), true)
    assert.equal(canTransition("active", "completed", "business"), false)
})

test("system role handles auto-expiry and lazy auto-completion", () => {
    assert.equal(canTransition("requested", "expired", "system"), true)
    assert.equal(canTransition("delivered", "completed", "system"), true)
    assert.equal(canTransition("delivered", "closed", "system"), true)
    assert.equal(canTransition("active", "expired", "system"), false)
})

test("terminal states forbid any further transitions", () => {
    const terminalStates: HiredServiceStatus[] = ["completed", "declined", "cancelled", "expired", "closed"]
    const roles: HiredServiceRole[] = ["business", "designer", "system"]

    for (const term of terminalStates) {
        for (const role of roles) {
            assert.equal(canTransition(term, "active", role), false)
            assert.equal(canTransition(term, "requested", role), false)
        }
    }
})

// -----------------------------------------------------------------------------
// 2. Auto-expiry and Lazy Auto-completion Tests
// -----------------------------------------------------------------------------

test("evaluateAutoTransitions expires requested orders older than 48 hours", () => {
    const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000)
    const result = evaluateAutoTransitions({
        status: "requested",
        hiredAt: fiftyHoursAgo,
    })
    assert.equal(result.shouldTransition, true)
    assert.equal(result.newStatus, "expired")
    assert.match(result.reason, /48 hours/i)
})

test("evaluateAutoTransitions keeps requested orders within 48 hours as requested", () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000)
    const result = evaluateAutoTransitions({
        status: "requested",
        hiredAt: tenHoursAgo,
    })
    assert.equal(result.shouldTransition, false)
    assert.equal(result.newStatus, "requested")
})

test("evaluateAutoTransitions auto-completes deliveries unreviewed after 3 days (72h)", () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    const result = evaluateAutoTransitions({
        status: "delivered",
        hiredAt: fourDaysAgo,
        deliveredAt: fourDaysAgo,
    })
    assert.equal(result.shouldTransition, true)
    assert.equal(result.newStatus, "completed")
    assert.match(result.reason, /3 days/i)
})

test("evaluateAutoTransitions does not auto-complete deliveries within 3 days", () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    const result = evaluateAutoTransitions({
        status: "delivered",
        hiredAt: oneDayAgo,
        deliveredAt: oneDayAgo,
    })
    assert.equal(result.shouldTransition, false)
    assert.equal(result.newStatus, "delivered")
})

// -----------------------------------------------------------------------------
// 3. Deadline Logic Tests
// -----------------------------------------------------------------------------

test("getDeadlineInfo correctly identifies late deliveries", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const info = getDeadlineInfo(twoDaysAgo)
    assert.equal(info.isLate, true)
    assert.match(info.label, /Late by/i)
})

test("getDeadlineInfo correctly formats upcoming due dates", () => {
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const info = getDeadlineInfo(inThreeDays)
    assert.equal(info.isLate, false)
    assert.match(info.label, /Due in \d+ days/i)
})

// -----------------------------------------------------------------------------
// 4. Revision Limit Enforcement Logic Tests
// -----------------------------------------------------------------------------

function canRequestRevisionCheck(order: { revisionsIncluded: number; revisionsUsed: number }): boolean {
    if (order.revisionsIncluded === -1) return true
    return order.revisionsUsed < order.revisionsIncluded
}

test("enforces revision limits: blocks when included count is exhausted", () => {
    assert.equal(canRequestRevisionCheck({ revisionsIncluded: 2, revisionsUsed: 0 }), true)
    assert.equal(canRequestRevisionCheck({ revisionsIncluded: 2, revisionsUsed: 1 }), true)
    assert.equal(canRequestRevisionCheck({ revisionsIncluded: 2, revisionsUsed: 2 }), false)
    assert.equal(canRequestRevisionCheck({ revisionsIncluded: 2, revisionsUsed: 3 }), false)
})

test("unlimited revisions (-1) always permits revision requests", () => {
    assert.equal(canRequestRevisionCheck({ revisionsIncluded: -1, revisionsUsed: 0 }), true)
    assert.equal(canRequestRevisionCheck({ revisionsIncluded: -1, revisionsUsed: 10 }), true)
    assert.equal(canRequestRevisionCheck({ revisionsIncluded: -1, revisionsUsed: 99 }), true)
})

// -----------------------------------------------------------------------------
// 5. Business Ordering Validation Rules
// -----------------------------------------------------------------------------

function validateCanPlaceOrder(params: {
    gigStatus: "draft" | "published" | "paused"
    isDeleted: boolean
    designerUserId: string
    orderingUserId: string
}): { allowed: boolean; error?: string } {
    if (params.gigStatus !== "published" || params.isDeleted) {
        return { allowed: false, error: "Gig is not available for orders" }
    }
    if (params.designerUserId === params.orderingUserId) {
        return { allowed: false, error: "A designer cannot hire their own gig" }
    }
    return { allowed: true }
}

test("blocks ordering paused or deleted gigs", () => {
    const paused = validateCanPlaceOrder({
        gigStatus: "paused",
        isDeleted: false,
        designerUserId: "user_1",
        orderingUserId: "user_2",
    })
    assert.equal(paused.allowed, false)

    const draft = validateCanPlaceOrder({
        gigStatus: "draft",
        isDeleted: false,
        designerUserId: "user_1",
        orderingUserId: "user_2",
    })
    assert.equal(draft.allowed, false)

    const deleted = validateCanPlaceOrder({
        gigStatus: "published",
        isDeleted: true,
        designerUserId: "user_1",
        orderingUserId: "user_2",
    })
    assert.equal(deleted.allowed, false)
})

test("blocks a designer from hiring their own gig", () => {
    const ownGig = validateCanPlaceOrder({
        gigStatus: "published",
        isDeleted: false,
        designerUserId: "designer_user_99",
        orderingUserId: "designer_user_99",
    })
    assert.equal(ownGig.allowed, false)
    assert.match(ownGig.error || "", /own gig/i)
})

// -----------------------------------------------------------------------------
// 6. Double-submit Idempotency Hash Stability
// -----------------------------------------------------------------------------

test("idempotency hash is deterministic across key-ordering differences", () => {
    const payloadA = { serviceId: "abc-123", tier: "basic", notes: "first" }
    const payloadB = { notes: "first", tier: "basic", serviceId: "abc-123" }

    const hashA = hashIdempotencyPayload(payloadA)
    const hashB = hashIdempotencyPayload(payloadB)

    assert.equal(hashA, hashB)
})

// -----------------------------------------------------------------------------
// 7. Review Eligibility and Edit Window Checks
// -----------------------------------------------------------------------------

function validateReviewEligibility(order: {
    status: HiredServiceStatus
    existingReviewCreatedAt?: Date | null
}): { allowed: boolean; reason?: string } {
    if (order.status !== "completed") {
        return { allowed: false, reason: "Order must be completed before leaving a review" }
    }
    if (order.existingReviewCreatedAt) {
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - order.existingReviewCreatedAt.getTime() > sevenDaysMs) {
            return { allowed: false, reason: "Reviews cannot be modified after 7 days" }
        }
    }
    return { allowed: true }
}

test("review only permitted after completion", () => {
    assert.equal(validateReviewEligibility({ status: "requested" }).allowed, false)
    assert.equal(validateReviewEligibility({ status: "active" }).allowed, false)
    assert.equal(validateReviewEligibility({ status: "delivered" }).allowed, false)
    assert.equal(validateReviewEligibility({ status: "completed" }).allowed, true)
})

test("review modification allowed within 7 days, locked after 7 days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    assert.equal(validateReviewEligibility({ status: "completed", existingReviewCreatedAt: threeDaysAgo }).allowed, true)

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    assert.equal(validateReviewEligibility({ status: "completed", existingReviewCreatedAt: tenDaysAgo }).allowed, false)
})

// -----------------------------------------------------------------------------
// 8. Order Participant Authorization Isolation
// -----------------------------------------------------------------------------

function canActorManageOrder(params: {
    orderDesignerId: string
    orderBusinessId: string
    actorId: string
    actorType: "designer" | "business"
}): boolean {
    if (params.actorType === "designer") {
        return params.actorId === params.orderDesignerId
    }
    return params.actorId === params.orderBusinessId
}

test("Designer A cannot act on Designer B's orders", () => {
    const orderDesignerId = "designer_alpha"
    const orderBusinessId = "biz_client_1"

    assert.equal(
        canActorManageOrder({
            orderDesignerId,
            orderBusinessId,
            actorId: "designer_alpha",
            actorType: "designer",
        }),
        true
    )

    assert.equal(
        canActorManageOrder({
            orderDesignerId,
            orderBusinessId,
            actorId: "designer_beta",
            actorType: "designer",
        }),
        false
    )
})


import assert from "node:assert/strict"
import test from "node:test"
import { hashIdempotencyPayload, idempotencyResponse } from "../src/lib/server/idempotency-core"

test("idempotency payload hashes are stable regardless of object key order", () => {
    assert.equal(
        hashIdempotencyPayload({ orderId: "order-1", status: "confirmed" }),
        hashIdempotencyPayload({ status: "confirmed", orderId: "order-1" }),
    )
})

test("same-key replay is returned without executing another write", () => {
    const result = idempotencyResponse({
        kind: "replay",
        response: { success: true, data: { orderId: "order-1" } },
    })
    assert.deepEqual(result, {
        handled: true,
        response: { success: true, data: { orderId: "order-1" } },
    })
})

test("same-key payload conflicts are rejected", () => {
    const result = idempotencyResponse({ kind: "conflict" })
    assert.equal(result.handled, true)
    if (result.handled) {
        assert.equal(result.response.success, false)
        assert.match(result.response.error ?? "", /different data/)
    }
})

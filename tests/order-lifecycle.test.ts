import test from "node:test"
import assert from "node:assert/strict"
import { canTransition } from "../src/lib/orders/lifecycle"

test("manufacturer can only advance through the lifecycle", () => {
    assert.equal(canTransition("placed", "confirmed", "manufacturer"), true)
    assert.equal(canTransition("confirmed", "proof_pending", "manufacturer"), true)
    assert.equal(canTransition("proof_approved", "in_production", "manufacturer"), true)
    assert.equal(canTransition("in_production", "quality_check", "manufacturer"), true)
    assert.equal(canTransition("quality_check", "dispatched", "manufacturer"), true)
    assert.equal(canTransition("dispatched", "confirmed", "manufacturer"), false)
})

test("vendor rejection and cancellation require explicit transitions", () => {
    assert.equal(canTransition("placed", "rejected", "manufacturer"), true)
    assert.equal(canTransition("confirmed", "cancelled", "manufacturer"), true)
    assert.equal(canTransition("in_production", "cancelled", "manufacturer"), false)
})

test("business can confirm delivery but cannot advance production", () => {
    assert.equal(canTransition("delivered", "completed", "business"), true)
    assert.equal(canTransition("proof_pending", "proof_approved", "business"), true)
    assert.equal(canTransition("confirmed", "in_production", "business"), false)
})

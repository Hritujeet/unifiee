import crypto from "crypto"
import { and, eq, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import { idempotencyRecordsTable } from "@/lib/db/schema/idempotency"
import { hashIdempotencyPayload, type BeginResult, type StoredResponse } from "@/lib/server/idempotency-core"
export { hashIdempotencyPayload, idempotencyResponse } from "@/lib/server/idempotency-core"

export async function beginIdempotency(
    scope: string,
    key: string,
    userId: string,
    payload: unknown,
    ttlMinutes = 24,
): Promise<BeginResult> {
    const requestHash = hashIdempotencyPayload(payload)
    const now = new Date()
    await db.delete(idempotencyRecordsTable)
        .where(lte(idempotencyRecordsTable.expiresAt, now))
    const existing = await db
        .select()
        .from(idempotencyRecordsTable)
        .where(and(
            eq(idempotencyRecordsTable.scope, scope),
            eq(idempotencyRecordsTable.key, key),
            eq(idempotencyRecordsTable.userId, userId),
        ))
        .limit(1)

    if (existing[0]) {
        if (existing[0].expiresAt <= now) {
            await db.delete(idempotencyRecordsTable).where(and(
                eq(idempotencyRecordsTable.id, existing[0].id),
                lte(idempotencyRecordsTable.expiresAt, now),
            ))
            return beginIdempotency(scope, key, userId, payload, ttlMinutes)
        }
        if (existing[0].requestHash !== requestHash) return { kind: "conflict" }
        if (existing[0].status === "completed" && existing[0].response) {
            return { kind: "replay", response: existing[0].response }
        }
        return { kind: "in_progress" }
    }

    const id = crypto.randomUUID()
    const inserted = await db.insert(idempotencyRecordsTable).values({
        id,
        scope,
        key,
        userId,
        requestHash,
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    }).onConflictDoNothing({
        target: [
            idempotencyRecordsTable.scope,
            idempotencyRecordsTable.key,
            idempotencyRecordsTable.userId,
        ],
    }).returning({ id: idempotencyRecordsTable.id })

    if (inserted.length) return { kind: "new", id }
    return beginIdempotency(scope, key, userId, payload, ttlMinutes)
}

export async function completeIdempotency(id: string, response: StoredResponse): Promise<void> {
    await db.update(idempotencyRecordsTable)
        .set({ status: "completed", response })
        .where(eq(idempotencyRecordsTable.id, id))
}

export async function failIdempotency(id: string, response: StoredResponse): Promise<void> {
    await completeIdempotency(id, response)
}

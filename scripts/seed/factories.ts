import { createHash } from "node:crypto"

const SEED_NAMESPACE = "7e3c9f39-4a2d-4c1c-9e0a-2efc61f18c91"

export function seedUuid(key: string): string {
    const bytes = createHash("sha1")
        .update(`${SEED_NAMESPACE}:${key}`)
        .digest()
    const hex = Buffer.from(bytes.subarray(0, 16))
    hex[6] = (hex[6] & 0x0f) | 0x50
    hex[8] = (hex[8] & 0x3f) | 0x80
    const value = hex.toString("hex")
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

export function seedKey(prefix: string, key: string): string {
    return `seed-${prefix}-${key}@seed.unifiee.test`
}

export function seedPhone(index: number): string {
    return `+91980000${String(index).padStart(4, "0")}`
}

export function seedDate(daysFromNow: number, hour = 10): Date {
    const date = new Date()
    date.setUTCHours(hour, 0, 0, 0)
    date.setUTCDate(date.getUTCDate() + daysFromNow)
    return date
}

export function money(value: number): string {
    return value.toFixed(2)
}

export function hostFromDatabaseUrl(url: string): string {
    try {
        return new URL(url).hostname
    } catch {
        return "unknown"
    }
}

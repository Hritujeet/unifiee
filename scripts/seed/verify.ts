import { config } from "dotenv"
config({ path: ".env.local" })

import { db } from "../../src/lib/db"
import { sql } from "drizzle-orm"

const expected = [
    ["seed users", "user", 17],
    ["business profiles", "business", 6],
    ["designer profiles", "packaging_designers", 3],
    ["manufacturer profiles", "manufacturer", 4],
    ["designer services", "designer_services", 9],
    ["offerings", "offerings", 16],
    ["requirements", "business_requirements", 10],
    ["quotations", "vendor_quotations", 20],
    ["orders", "business_orders", 7],
    ["hired services", "business_hired_services", 3],
] as const

async function main() {
    const failures: string[] = []
    for (const [label, table, minimum] of expected) {
        const result = await db.execute(sql.raw(`SELECT count(*)::int AS count FROM "${table}"`))
        const actual = Number((result.rows[0] as { count?: number } | undefined)?.count ?? 0)
        console.log(`${label}: ${actual}`)
        if (actual < minimum) failures.push(`${label} expected at least ${minimum}, got ${actual}`)
    }
    const acceptedWithoutOrder = await db.execute(sql`
        SELECT count(*)::int AS count
        FROM vendor_quotations q
        LEFT JOIN business_orders o ON o.quote_id = q.id
        WHERE q.status = 'accepted' AND o.id IS NULL
    `)
    if (Number((acceptedWithoutOrder.rows[0] as { count?: number } | undefined)?.count ?? 0) > 0) {
        failures.push("accepted quotations without orders")
    }
    if (failures.length) {
        console.error(failures.join("\n"))
        process.exitCode = 1
        return
    }
    console.log("Seed verification passed.")
}

main()
    .catch((error) => {
        console.error("Verification failed:", error)
        process.exitCode = 1
    })
    .finally(async () => {
        await db.$client.end()
    })

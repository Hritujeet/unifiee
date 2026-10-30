import { auth } from "../../src/lib/auth"
import { db } from "../../src/lib/db"
import { account, user } from "../../src/lib/db/schema/auth-schema"
import { eq } from "drizzle-orm"
import { seedKey } from "./factories"

export type SeedAccount = {
    key: string
    name: string
    role: "business" | "designer" | "manufacturer" | "none"
    provider?: "credential" | "google"
}

export async function ensureSeedAccount(input: SeedAccount, password: string): Promise<string> {
    const email = seedKey(input.role, input.key)
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)
    if (existing[0]) return existing[0].id

    if (input.provider === "google") {
        const context = await auth.$context
        const created = await context.internalAdapter.createOAuthUser({
            name: input.name,
            email,
            emailVerified: true,
        }, {
            accountId: `seed-google-${input.key}`,
            providerId: "google",
        })
        return created.user.id
    }

    const result = await auth.api.signUpEmail({
        body: { name: input.name, email, password },
        headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
    })
    if (!result.user?.id) throw new Error(`Better Auth did not return a user for ${email}`)
    await db.update(user).set({ emailVerified: true }).where(eq(user.id, result.user.id))
    return result.user.id
}

export async function providerForSeedUser(userId: string): Promise<string | null> {
    const [row] = await db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, userId)).limit(1)
    return row?.providerId ?? null
}

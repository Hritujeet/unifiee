import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
})

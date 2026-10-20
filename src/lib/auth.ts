import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { user, session, account, verification } from "./db/schema/auth-schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
        maxPasswordLength: 128,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
    },
    rateLimit: {
        enabled: true,
        window: 60,
        max: 60,
        customRules: {
            "/sign-in/email": {
                window: 60,
                max: 5,
            },
            "/sign-in/social": {
                window: 60,
                max: 10,
            },
            "/sign-up/email": {
                window: 60,
                max: 5,
            },
            "/set-password": {
                window: 60,
                max: 5,
            },
            "/change-password": {
                window: 60,
                max: 5,
            },
        },
        storage: "memory",
    },
    advanced: {
        ipAddress: {
            ipAddressHeaders: [
                "x-vercel-forwarded-for",
                "cf-connecting-ip",
                "x-real-ip",
                "x-forwarded-for",
            ],
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
            allowDifferentEmails: false,
        }
    },
    databaseHooks: {
        account: {
            create: {
                after: async (createdAccount) => {
                    await db
                        .update(user)
                        .set({ emailVerified: true })
                        .where(eq(user.id, createdAccount.userId));
                },
            },
        },
    },
    trustedOrigins: [
        "https://*.vercel.app",
        "https://*.hritujeets-projects.vercel.app"
    ]
});
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { setPasswordSchema } from "@/lib/zod-schema";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit";
import { z } from "zod";

export async function setPasswordAction(data: z.infer<typeof setPasswordSchema>) {
  try {
    const reqHeaders = await headers();
    const clientIp = getClientIpFromHeaders(reqHeaders);

    // 1. Session verification
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: "Your session has expired or is unauthorized. Please sign in again.",
      };
    }

    // 2. Rate limiting (max 5 password attempts per 5 minutes per user/IP)
    const rateCheck = await checkRateLimit(
      {
        keyPrefix: "set-password",
        limit: 5,
        windowSeconds: 300,
      },
      `${session.user.id}:${clientIp}`
    );

    if (!rateCheck.success) {
      return {
        success: false,
        error: `Too many password update attempts. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`,
      };
    }

    // 3. Server-side validation
    const result = setPasswordSchema.safeParse(data);
    if (!result.success) {
      return { success: false, error: result.error.issues[0]?.message || "Invalid password format" };
    }

    const validatedData = result.data;

    // 4. Use Better Auth API to set the password
    await auth.api.setPassword({
      body: {
        newPassword: validatedData.password,
      },
      headers: reqHeaders,
    });

    return {
      success: true,
      userCreatedAt: new Date(session.user.createdAt).getTime(),
    };
  } catch (error) {
    console.error("Error setting password:", error);
    const message = error instanceof Error ? error.message : "Password service unavailable";
    return { success: false, error: `Could not set password: ${message}` };
  }
}
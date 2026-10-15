"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { setPasswordSchema } from "@/lib/zod-schema";
import { z } from "zod";

export async function setPasswordAction(data: z.infer<typeof setPasswordSchema>) {
  try {
    const result = setPasswordSchema.safeParse(data);
    
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }
    
    const validatedData = result.data;
    
    // Resolve headers once and reuse
    const reqHeaders = await headers();

    // Get session
    const session = await auth.api.getSession({
      headers: reqHeaders
    });
    
    if (!session || !session.user) {
      return { success: false, error: "Your session has expired or is unauthorized. Please sign in again." };
    }
    
    // Use Better Auth API to set the password
    await auth.api.setPassword({
      body: {
        newPassword: validatedData.password
      },
      headers: reqHeaders
    });
    
    return { success: true, userCreatedAt: session.user.createdAt.getTime() };
  } catch (error) {
    console.error("Error setting password:", error);
    const message = error instanceof Error ? error.message : "Password service unavailable";
    return { success: false, error: `Could not set password: ${message}` };
  }
}
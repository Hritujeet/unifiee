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
    
    // Get session
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Use Better Auth API to set the password
    await auth.api.setPassword({
      body: {
        newPassword: validatedData.password
      },
      headers: await headers()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error setting password:", error);
    return { success: false, error: "Something went wrong" };
  }
}
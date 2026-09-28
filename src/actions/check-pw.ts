"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema/auth-schema";
import { eq, and } from "drizzle-orm";

export async function checkHasPasswordAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session || !session.user) {
      return false;
    }
    
    const userAccounts = await db
      .select({ password: account.password })
      .from(account)
      .where(and(eq(account.userId, session.user.id), eq(account.providerId, "credential")))
      .limit(1);
      
    if (userAccounts.length === 0) {
      return false;
    }
    
    const credAccount = userAccounts[0];
    
    if (!credAccount.password || credAccount.password.trim() === "") {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking password:", error);
    return false;
  }
}

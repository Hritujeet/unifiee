import { db } from "@/lib/db";
import { account } from "@/lib/db/schema/auth-schema";
import { eq, and } from "drizzle-orm";

export async function userHasPassword(userId: string): Promise<boolean> {
  try {
    const userAccounts = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, "credential")
        )
      );

    if (userAccounts.length === 0) {
      return false;
    }

    const credAccount = userAccounts[0];

    return !!credAccount.password && credAccount.password.trim() !== "";
  } catch (error) {
    console.error("Error checking user password:", error);
    return false;
  }
}

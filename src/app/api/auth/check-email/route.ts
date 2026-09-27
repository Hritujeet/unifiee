import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema/auth-schema";
import { eq, sql, and } from "drizzle-orm";

const checkEmailSchema = z.object({
  email: z.string().email(),
});

// A simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ status: "error" }, { status: 429 });
    }

    const body = await req.json();
    const result = checkEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ status: "error" }, { status: 400 });
    }

    const email = result.data.email.toLowerCase();

    // Query Drizzle for user
    const foundUsers = await db
      .select()
      .from(user)
      .where(sql`lower(${user.email}) = ${email}`);

    if (foundUsers.length === 0) {
      return NextResponse.json({ status: "not_registered" });
    }
    
    const dbUser = foundUsers[0];

    const userAccounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, dbUser.id), eq(account.providerId, "credential")));

    if (userAccounts.length === 0) {
      return NextResponse.json({ status: "set_pw" });
    }
    
    const credentialAccount = userAccounts[0];

    if (!credentialAccount.password || credentialAccount.password.trim() === "") {
      return NextResponse.json({ status: "set_pw" });
    }

    return NextResponse.json({ status: "enter_pw" });

  } catch (error) {
    console.error("Error in check-email:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

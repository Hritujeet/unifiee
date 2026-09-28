import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema/auth-schema";
import { eq, sql, and } from "drizzle-orm";

const checkEmailSchema = z.object({
  email: z.string().email(),
});

// In-memory rate limiter with periodic stale-entry cleanup
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

// Purge stale entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap) {
    if (now - record.lastReset > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
    const parsed = checkEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ status: "error" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();

    // Single JOIN query instead of two sequential round-trips
    const rows = await db
      .select({
        userId: user.id,
        password: account.password,
        providerId: account.providerId,
      })
      .from(user)
      .leftJoin(
        account,
        and(
          eq(account.userId, user.id),
          eq(account.providerId, "credential")
        )
      )
      .where(sql`lower(${user.email}) = ${email}`)
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ status: "not_registered" });
    }

    const row = rows[0];

    // No credential account row joined → user exists but has no password set
    if (!row.providerId) {
      return NextResponse.json({ status: "set_pw" });
    }

    if (!row.password || row.password.trim() === "") {
      return NextResponse.json({ status: "set_pw" });
    }

    return NextResponse.json({ status: "enter_pw" });

  } catch (error) {
    console.error("Error in check-email:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

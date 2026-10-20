import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema/auth-schema";
import { eq, sql, and } from "drizzle-orm";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit";

const checkEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(255, "Email address is too long"),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIpFromHeaders(req.headers);
    const rateCheck = await checkRateLimit(
      {
        keyPrefix: "check-email",
        limit: 5,
        windowSeconds: 60,
      },
      clientIp
    );

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          status: "error",
          error: "Too many sign-in attempts. Please wait a minute before trying again.",
          retryAfter: rateCheck.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.resetInSeconds),
          },
        }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = checkEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          error: parsed.error.issues[0]?.message || "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email;

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
    if (!row.providerId || !row.password || row.password.trim() === "") {
      return NextResponse.json({ status: "set_pw" });
    }

    return NextResponse.json({ status: "enter_pw" });
  } catch (error) {
    console.error("Error in check-email route:", error);
    return NextResponse.json(
      { status: "error", error: "Internal server error" },
      { status: 500 }
    );
  }
}

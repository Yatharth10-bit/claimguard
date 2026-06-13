import { NextResponse } from "next/server";
import { z } from "zod";
import { LEGAL_POLICY_VERSION } from "@/lib/legalContent";
import { getClientIp } from "@/lib/request";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const inputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  fullName: z.string().trim().optional().default(""),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details.", details: parsed.error.flatten() }, { status: 400 });
  }

  const limit = await checkRateLimit(`signup:${getClientIp(request)}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again shortly." }, { status: 429 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  const { email, password, fullName } = parsed.data;
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      terms_accepted_at: new Date().toISOString(),
      terms_version: LEGAL_POLICY_VERSION,
    },
  });

  if (error) {
    const message = /already|registered|exists/i.test(error.message)
      ? "An account with this email already exists."
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
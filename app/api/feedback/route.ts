import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

const inputSchema = z.object({
  message: z.string().trim().min(10).max(4000),
  category: z.enum(["bug", "feature", "billing", "compliance", "other"]).default("other"),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback.", details: parsed.error.flatten() }, { status: 400 });

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    await admin.from("feedback_messages").insert({
      user_id: user.id,
      category: parsed.data.category,
      message: parsed.data.message,
    });
  }

  return NextResponse.json({ ok: true, message: "Thanks — your feedback was received." });
}
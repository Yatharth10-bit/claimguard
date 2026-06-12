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
  const userId = supabase ? (await supabase.auth.getUser()).data.user?.id ?? null : null;
  const admin = getSupabaseAdmin();

  if (admin) {
    await admin.from("feedback_messages").insert({
      user_id: userId,
      category: parsed.data.category,
      message: parsed.data.message,
    });
  }

  return NextResponse.json({ ok: true, message: "Thanks — your feedback was received." });
}
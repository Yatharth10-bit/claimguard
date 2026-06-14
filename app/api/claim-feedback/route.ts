import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";

const schema = z.object({
  claim_check_result_id: z.string().uuid().optional(),
  claim_id: z.string().uuid().optional(),
  feedback_type: z.enum(["accurate", "too_strict", "too_weak", "rewrite_bad", "missed_risk", "wrong_category"]),
  user_correction: z.string().trim().max(5000).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await admin.from("claim_feedback").insert({
    user_id: user.id,
    claim_check_result_id: parsed.data.claim_check_result_id || null,
    claim_id: parsed.data.claim_id || null,
    feedback_type: parsed.data.feedback_type,
    user_correction: parsed.data.user_correction,
    notes: parsed.data.notes,
  }).select().single();

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({
        ok: true,
        message: "Feedback received locally. Run supabase/claim-intelligence-engine.sql to persist feedback.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Thanks — your feedback was saved for review. It will not change live results immediately.",
    feedback: data,
  });
}
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  claim_text: z.string().trim().min(3).max(5000).optional(),
  evidence_title: z.string().trim().max(500).optional(),
  evidence_url: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(10000).optional(),
  approved_by: z.string().trim().max(255).optional().nullable(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update.", details: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.approved_by) updates.approved_at = new Date().toISOString();

  const { data, error } = await admin
    .from("substantiation_entries")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { id } = await params;

  const { data, error } = await admin
    .from("substantiation_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
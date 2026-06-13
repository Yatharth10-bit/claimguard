import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  mark_all_read: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data, error } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = (data || []).filter((n) => !n.read_at).length;
  return NextResponse.json({ notifications: data || [], unread });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update.", details: parsed.error.flatten() }, { status: 400 });
  }

  const readAt = new Date().toISOString();

  if (parsed.data.mark_all_read) {
    const { error } = await admin
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.ids?.length) {
    const { error } = await admin
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .in("id", parsed.data.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Provide ids or mark_all_read." }, { status: 400 });
}
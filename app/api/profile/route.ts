import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureBrandProfilesBucket, loadRemoteBrandProfile, saveRemoteBrandProfile } from "@/lib/brandProfileRemote";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

const profileSchema = z.object({
  brandName: z.string().trim().max(200),
  sector: z.string().trim().max(100),
  productType: z.string().trim().max(200),
  commonClaims: z.string().trim().max(5000),
  ingredients: z.string().trim().max(5000),
  salesRegions: z.array(z.string().trim().max(100)).max(50),
  salesChannels: z.array(z.string().trim().max(100)).max(50),
  mainConcern: z.string().trim().max(500),
  complianceLevel: z.string().trim().max(100),
  firstClaim: z.string().trim().max(5000),
  onboardingCompleted: z.boolean(),
  createdAt: z.string().trim().max(50),
  updatedAt: z.string().trim().max(50),
});

export async function GET() {
  const supabase = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) return NextResponse.json({ profile: null, configured: false });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const profile = await loadRemoteBrandProfile(admin, user.id);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    if (!supabase || !admin) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile payload.", details: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date().toISOString();
    const profile = {
      ...parsed.data,
      createdAt: parsed.data.createdAt || now,
      updatedAt: now,
    };

    await ensureBrandProfilesBucket(admin);

    const result = await saveRemoteBrandProfile(
      admin,
      user.id,
      user.email,
      String(user.user_metadata?.full_name || ""),
      profile,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Could not save profile." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, profile, method: result.method });
  } catch {
    return NextResponse.json({ error: "Unable to save profile right now." }, { status: 500 });
  }
}
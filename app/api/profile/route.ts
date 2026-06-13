import { NextResponse } from "next/server";
import { z } from "zod";
import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { getSupabaseServer } from "@/lib/supabase/server";

const profileSchema = z.object({
  brandName: z.string(),
  sector: z.string(),
  productType: z.string(),
  commonClaims: z.string(),
  ingredients: z.string(),
  salesRegions: z.array(z.string()),
  salesChannels: z.array(z.string()),
  mainConcern: z.string(),
  complianceLevel: z.string(),
  firstClaim: z.string(),
  onboardingCompleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ profile: null, configured: false });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("brand_compliance_profile")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({
    profile: (data?.brand_compliance_profile as BrandComplianceProfile | null) ?? null,
  });
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile payload.", details: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;
    const now = new Date().toISOString();
    const profile: BrandComplianceProfile = {
      ...payload,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ brand_compliance_profile: profile })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (!updateError && updated) {
      return NextResponse.json({ ok: true, profile });
    }

    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: String(user.user_metadata?.full_name || ""),
        brand_compliance_profile: profile,
      });

    if (insertError) {
      const hint = insertError.message.includes("brand_compliance_profile")
        ? " Run the migration: alter table public.profiles add column if not exists brand_compliance_profile jsonb;"
        : "";
      return NextResponse.json({
        error: `${insertError.message}${hint}`,
        code: insertError.code,
        updateError: updateError?.message,
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, profile, created: true });
  } catch {
    return NextResponse.json({ error: "Unable to save profile right now." }, { status: 500 });
  }
}
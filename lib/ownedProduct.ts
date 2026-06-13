import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnedProductRow = {
  id: string;
  name?: string;
  category?: string;
  ingredients?: string[];
  market?: string;
};

export async function fetchOwnedProduct(
  admin: SupabaseClient,
  userId: string,
  productId: string,
  fields = "id, name, category, ingredients, market",
): Promise<{ product: OwnedProductRow | null; error: string | null }> {
  const { data, error } = await admin
    .from("products")
    .select(fields)
    .eq("id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { product: null, error: error.message };
  return { product: (data as OwnedProductRow | null) ?? null, error: null };
}
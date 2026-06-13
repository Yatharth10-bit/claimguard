import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { scanSocialCaption } from "@/lib/socialScanner";

const createSchema = z.object({
  connection_id: z.string().uuid(),
  caption: z.string().trim().min(1).max(10000),
  product_id: z.string().uuid().optional().nullable(),
  post_url: z.string().trim().max(2000).optional().default(""),
});

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: connections } = await admin
    .from("social_connections")
    .select("id")
    .eq("user_id", user.id);

  const connectionIds = (connections || []).map((c) => c.id);
  if (!connectionIds.length) return NextResponse.json({ posts: [] });

  const { data: posts, error } = await admin
    .from("social_posts")
    .select("*, social_connections(platform, account_handle)")
    .in("social_connection_id", connectionIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const postIds = (posts || []).map((p) => p.id);
  let flagsByPost: Record<string, unknown[]> = {};
  if (postIds.length) {
    const { data: flags } = await admin.from("social_post_flags").select("*").in("social_post_id", postIds);
    for (const flag of flags || []) {
      const key = flag.social_post_id as string;
      if (!flagsByPost[key]) flagsByPost[key] = [];
      flagsByPost[key].push(flag);
    }
  }

  return NextResponse.json({
    posts: (posts || []).map((post) => ({
      ...post,
      flags: flagsByPost[post.id] || [],
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: connection } = await admin
    .from("social_connections")
    .select("id, platform")
    .eq("id", parsed.data.connection_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection) return NextResponse.json({ error: "Connection not found." }, { status: 404 });

  let product = {
    category: "Dietary Supplement",
    ingredients: [] as string[],
    market: "United States FDA + FTC",
  };

  if (parsed.data.product_id) {
    const { data: productRow } = await admin
      .from("products")
      .select("category, ingredients, market")
      .eq("id", parsed.data.product_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (productRow) {
      product = {
        category: productRow.category || product.category,
        ingredients: productRow.ingredients || [],
        market: productRow.market || product.market,
      };
    }
  }

  const scan = scanSocialCaption(parsed.data.caption, product, connection.platform);
  const platformPostId = `manual-${Date.now()}`;

  const { data: post, error: postError } = await admin
    .from("social_posts")
    .insert({
      social_connection_id: connection.id,
      platform_post_id: platformPostId,
      platform: connection.platform,
      caption: parsed.data.caption,
      post_url: parsed.data.post_url || "",
      posted_at: new Date().toISOString(),
      scan_status: scan.scan_status,
    })
    .select()
    .single();

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });

  if (scan.flags.length) {
    await admin.from("social_post_flags").insert(
      scan.flags.map((flag) => ({
        social_post_id: post.id,
        phrase: flag.phrase,
        rule_triggered: flag.rule_triggered,
        severity: flag.severity,
        rewrite_suggestion: flag.rewrite_suggestion,
      })),
    );
  }

  if (scan.scan_status === "flagged") {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "social_post_flagged",
      title: "Social post flagged",
      body: `Caption on ${connection.platform} needs review.`,
      link: "/social",
    });
  }

  await admin
    .from("social_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", connection.id);

  return NextResponse.json({ post, flags: scan.flags });
}
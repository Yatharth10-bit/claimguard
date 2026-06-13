import { createClient } from "@supabase/supabase-js";
import { loadRemoteBrandProfile, saveRemoteBrandProfile, ensureBrandProfilesBucket } from "../lib/brandProfileRemote";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const userId = "35179f03-13ef-4c98-8a0f-70bea4f7baf1";

async function main() {
  await ensureBrandProfilesBucket(admin);
  const profile = {
    brandName: "ClaimGuard Test Brand",
    sector: "Supplements",
    productType: "Capsules",
    commonClaims: "",
    ingredients: "",
    salesRegions: ["United States"],
    salesChannels: ["Website"],
    mainConcern: "FDA claims",
    complianceLevel: "Beginner",
    firstClaim: "",
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved = await saveRemoteBrandProfile(admin, userId, "yatharthlegend252@gmail.com", "Yatharth", profile);
  console.log("save result:", saved);
  const loaded = await loadRemoteBrandProfile(admin, userId);
  console.log("loaded:", loaded?.brandName, "complete:", loaded?.onboardingCompleted);
}

main();
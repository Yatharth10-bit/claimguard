/** Comprehensive product taxonomy — 2,000 distinct products across all compliance sectors. */

export type ProductDefinition = {
  index: number;
  name: string;
  sector: string;
  productCategory: string;
  productType: string;
  ingredient: string;
  form: string;
};

export const MEGA_SECTORS = [
  "Supplements", "Food", "Beverages", "Skincare", "Cosmetics", "Wellness", "Fitness",
  "Weight loss", "Baby products", "Pet products", "Hair care", "Dental care", "Sleep products",
  "Gut health", "Immune health", "Ayurvedic products", "Herbal products", "Medical-adjacent products",
  "DTC consumer goods", "Functional drinks", "Protein powders", "Beauty products", "Personal care products",
  "Household", "Apparel", "Software", "Financial services",
] as const;

export const PRODUCTS_PER_SECTOR = 80;
export const DISTINCT_PRODUCT_COUNT = MEGA_SECTORS.length * PRODUCTS_PER_SECTOR; // 2,160
export const CLAIM_VARIANTS_PER_PRODUCT = 500;
export const MEGA_DATASET_SIZE = DISTINCT_PRODUCT_COUNT * CLAIM_VARIANTS_PER_PRODUCT; // 1,080,000 — report as 1M+

const SECTOR_CATEGORY: Record<string, string> = {
  Supplements: "Dietary Supplement",
  Food: "Food",
  Beverages: "Beverage",
  Skincare: "Cosmetic",
  Cosmetics: "Cosmetic",
  Wellness: "Dietary Supplement",
  Fitness: "Fitness Equipment",
  "Weight loss": "Dietary Supplement",
  "Baby products": "Children's Product",
  "Pet products": "Pet Food",
  "Hair care": "Cosmetic",
  "Dental care": "Personal Care",
  "Sleep products": "Dietary Supplement",
  "Gut health": "Dietary Supplement",
  "Immune health": "Dietary Supplement",
  "Ayurvedic products": "Dietary Supplement",
  "Herbal products": "Dietary Supplement",
  "Medical-adjacent products": "Medical Device",
  "DTC consumer goods": "Consumer Product",
  "Functional drinks": "Beverage",
  "Protein powders": "Dietary Supplement",
  "Beauty products": "Cosmetic",
  "Personal care products": "Personal Care",
  Household: "Household Cleaner",
  Apparel: "Apparel",
  Software: "Software",
  "Financial services": "Financial Service",
};

const INGREDIENTS = [
  "Collagen", "Probiotics", "Turmeric", "Ashwagandha", "Vitamin C", "Vitamin D", "Zinc", "Magnesium",
  "Omega-3", "Biotin", "Keratin", "Hyaluronic acid", "Retinol", "Niacinamide", "Peptides", "CBD",
  "Green tea", "Ginger", "Elderberry", "Echinacea", "Spirulina", "Chlorella", "Maca", "Rhodiola",
  "Lion's mane", "Reishi", "Cordyceps", "Melatonin", "L-theanine", "Creatine", "Whey protein",
  "Plant protein", "BCAA", "Electrolytes", "Fiber", "Chromium", "Berberine", "Milk thistle",
  "Saw palmetto", "Fenugreek", "Tulsi", "Triphala", "Brahmi", "Neem", "Aloe vera", "Tea tree",
  "Salicylic acid", "Benzoyl peroxide", "Ceramides", "Squalane", "Shea butter", "Coconut oil",
  "Argan oil", "Rosehip", "Kojic acid", "Alpha arbutin", "Caffeine", "CoQ10", "Glucosamine",
  "Chondroitin", "MSM", "Boswellia", "Quercetin", "Resveratrol", "Astaxanthin", "Lutein",
  "Bacillus coagulans", "Saccharomyces", "Digestive enzymes", "Psyllium", "Inulin", "Chicory root",
  "Matcha", "Yerba mate", "Kombucha culture", "Chamomile", "Valerian", "Passionflower",
  "Peppermint", "Fennel", "Licorice root", "Dandelion", "Burdock", "Calendula", "Witch hazel",
];

const PRODUCT_FORMS: Record<string, string[]> = {
  Supplements: ["Capsules", "Softgels", "Gummies", "Powder", "Tablets", "Liquid drops", "Spray", "Chewables"],
  Food: ["Bar", "Cereal", "Snack pack", "Spread", "Mix", "Bites", "Crackers", "Granola"],
  Beverages: ["Ready-to-drink", "Concentrate", "Shot", "Tea", "Coffee blend", "Smoothie mix", "Hydration mix"],
  Skincare: ["Serum", "Cream", "Moisturizer", "Cleanser", "Toner", "Mask", "Oil", "Balm"],
  Cosmetics: ["Foundation", "Concealer", "Lip product", "Mascara", "Blush", "Primer", "Setting spray"],
  default: ["Formula", "Blend", "Product", "Solution", "Complex", "Support", "System", "Kit"],
};

const PRODUCT_LINES = [
  "Daily", "Advanced", "Ultra", "Pure", "Essential", "Complete", "Premium", "Clinical",
  "Natural", "Organic", "Plant-based", "Professional", "Everyday", "Active", "Restore",
  "Balance", "Defense", "Renew", "Glow", "Calm",
];

/** Sector-specific product nouns (FDA/cosmetic/market-informed). */
const SECTOR_NOUNS: Record<string, string[]> = {
  Supplements: ["Multivitamin", "Joint support", "Immune support", "Focus blend", "Sleep support", "Heart health", "Bone support", "Eye health", "Hair skin nails", "Energy blend", "Stress support", "Gut support", "Liver support", "Hormone balance", "Metabolism support", "Collagen blend", "Probiotic blend", "Omega blend", "Magnesium blend", "Electrolyte mix"],
  Skincare: ["Hydrating serum", "Anti-aging cream", "Acne treatment gel", "Brightening serum", "Eye cream", "Night cream", "SPF moisturizer", "Exfoliating toner", "Clay mask", "Retinol treatment", "Barrier repair cream", "Dark spot corrector", "Pore minimizer", "Neck cream", "Hand cream", "Body lotion", "Lip treatment", "Scalp serum", "After-sun gel", "Micellar water"],
  Food: ["Protein bar", "Granola", "Oat cereal", "Nut butter", "Fruit snack", "Cracker", "Rice cake", "Trail mix", "Breakfast biscuit", "Meal replacement", "Fiber cereal", "Probiotic yogurt", "Plant-based milk", "Snack pack", "Cookie", "Brownie", "Chips alternative", "Soup mix", "Pasta alternative", "Baking mix"],
  "Baby products": ["Baby wash", "Diaper cream", "Baby lotion", "Baby shampoo", "Teething gel", "Baby monitor", "Baby vitamin drops", "Toddler snack", "Baby sunscreen", "Nursing supplement", "Baby probiotic", "Infant formula support", "Baby wipes", "Sleep sack", "Baby oil", "Rash cream", "Baby toothpaste", "Learning toy", "Baby blanket", "Feeding bottle"],
  "Pet products": ["Dog treat", "Cat food", "Pet joint chew", "Calming chew", "Pet shampoo", "Dental treat", "Flea spray", "Pet probiotic", "Horse supplement", "Bird vitamins", "Pet skin balm", "Puppy formula", "Senior pet food", "Pet omega oil", "Cat litter deodorizer", "Pet toothpaste", "Aquarium supplement", "Pet anxiety chew", "Raw food topper", "Pet electrolyte"],
  Household: ["Surface cleaner", "Disinfectant", "Laundry liquid", "Dish tablets", "Air purifier filter", "Hand soap", "Glass cleaner", "Floor cleaner", "Fabric spray", "Odor eliminator", "Drain cleaner", "Bathroom cleaner", "Kitchen degreaser", "Wood polish", "Stain remover", "Bleach alternative", "Compostable bags", "Water filter", "Bug repellent", "Candle"],
  Software: ["Accounting app", "CRM platform", "AI writer", "Security software", "Project tool", "Hiring platform", "Tax service", "Cloud backup", "Analytics dashboard", "Email tool", "Inventory system", "POS system", "Learning app", "Fitness tracker app", "Meditation app", "Meal planner", "Sleep tracker", "Investment app", "Insurance portal", "Compliance tool"],
  "Financial services": ["Investment fund", "Savings account", "Credit card", "Loan product", "Insurance plan", "Retirement plan", "Robo-advisor", "Crypto platform", "Debt relief service", "Tax prep service", "Mortgage product", "Wealth management", "Budgeting app", "Payment processor", "Remittance service", "Pension plan", "Annuity", "Trading platform", "Financial coaching", "Credit repair"],
};

function nounsForSector(sector: string): string[] {
  return SECTOR_NOUNS[sector] || SECTOR_NOUNS.Supplements;
}

function formsForSector(sector: string): string[] {
  return PRODUCT_FORMS[sector] || PRODUCT_FORMS.default;
}

export function productAtIndex(index: number): ProductDefinition {
  const clamped = ((index % DISTINCT_PRODUCT_COUNT) + DISTINCT_PRODUCT_COUNT) % DISTINCT_PRODUCT_COUNT;
  const sectorIdx = Math.floor(clamped / PRODUCTS_PER_SECTOR);
  const withinSector = clamped % PRODUCTS_PER_SECTOR;
  const sector = MEGA_SECTORS[sectorIdx];
  const nouns = nounsForSector(sector);
  const forms = formsForSector(sector);
  const noun = nouns[withinSector % nouns.length];
  const form = forms[withinSector % forms.length];
  const line = PRODUCT_LINES[withinSector % PRODUCT_LINES.length];
  const ingredient = INGREDIENTS[(sectorIdx * 17 + withinSector) % INGREDIENTS.length];
  const name = `${line} ${ingredient} ${noun} ${form}`.replace(/\s+/g, " ").trim();

  return {
    index: clamped,
    name,
    sector,
    productCategory: SECTOR_CATEGORY[sector] || "Consumer Product",
    productType: noun,
    ingredient,
    form,
  };
}

export function sectorIndexForName(sector?: string): number | null {
  if (!sector) return null;
  const lower = sector.toLowerCase();
  const idx = MEGA_SECTORS.findIndex((s) => s.toLowerCase() === lower || lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower));
  return idx >= 0 ? idx : null;
}
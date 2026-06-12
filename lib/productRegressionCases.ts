export type RegressionCase = {
  name: string;
  claim: string;
  expected: "low" | "medium" | "high";
  category: string;
  context?: string;
};

export const PRODUCT_REGRESSION_CASES: RegressionCase[] = [
  // Dietary supplements and wellness
  { name: "Daily Collagen", claim: "Supports healthy-looking skin, hair, and nails.", expected: "low", category: "Dietary Supplement" },
  { name: "Calm Gummies", claim: "Treats anxiety and depression naturally.", expected: "high", category: "Dietary Supplement" },
  { name: "Glucose Capsules", claim: "Reverses diabetes and lowers blood sugar.", expected: "high", category: "Dietary Supplement" },
  { name: "Immune Powder", claim: "Boosts immunity throughout the year.", expected: "medium", category: "Dietary Supplement" },
  { name: "Focus Capsules", claim: "Clinically proven to improve focus.", expected: "medium", category: "Dietary Supplement" },
  { name: "Joint Formula", claim: "Heals arthritis and eliminates joint pain.", expected: "high", category: "Dietary Supplement" },
  { name: "Sleep Blend", claim: "Supports a restful nighttime routine.", expected: "low", category: "Dietary Supplement" },
  { name: "Detox Tea", claim: "A complete detox cleanse for total wellness.", expected: "medium", category: "Dietary Supplement" },
  { name: "Herbal Defense", claim: "FDA certified herbal formula with no side effects.", expected: "high", category: "Dietary Supplement" },
  { name: "Heart Support", claim: "Maintains general cardiovascular wellness.", expected: "low", category: "Dietary Supplement" },

  // Food and beverages
  { name: "Oat Cereal", claim: "Made with whole grain oats.", expected: "low", category: "Food" },
  { name: "Probiotic Yogurt", claim: "Cures digestive disease with every serving.", expected: "high", category: "Food" },
  { name: "Energy Drink", claim: "Guaranteed energy and rapid results.", expected: "medium", category: "Beverage" },
  { name: "Kids Juice", claim: "Prevents colds and flu in children.", expected: "high", category: "Beverage" },
  { name: "Protein Bar", claim: "20 grams of protein per bar.", expected: "low", category: "Food" },
  { name: "Snack Pack", claim: "Doctor recommended for every child.", expected: "medium", category: "Food" },
  { name: "Organic Coffee", claim: "The world's best coffee.", expected: "medium", category: "Beverage" },
  { name: "Plant Milk", claim: "Supports a balanced plant-based diet.", expected: "low", category: "Beverage" },
  { name: "Sugar-Free Candy", claim: "100% safe for diabetics.", expected: "high", category: "Food" },
  { name: "Green Smoothie", claim: "Miracle weight loss in seven days.", expected: "medium", category: "Beverage" },

  // Cosmetics and personal care
  { name: "Hydrating Serum", claim: "Helps skin feel hydrated and smooth.", expected: "low", category: "Cosmetic" },
  { name: "Acne Serum", claim: "Eradicates acne permanently.", expected: "high", category: "Cosmetic" },
  { name: "Hair Tonic", claim: "Reverses hair loss and regrows hair.", expected: "high", category: "Cosmetic" },
  { name: "Age Serum", claim: "Advanced anti-aging formula.", expected: "medium", category: "Cosmetic" },
  { name: "Face Cream", claim: "Dermatologist tested for sensitive skin.", expected: "medium", category: "Cosmetic" },
  { name: "Sunscreen", claim: "Prevents skin cancer all day.", expected: "high", category: "Cosmetic" },
  { name: "Body Lotion", claim: "Leaves skin feeling soft.", expected: "low", category: "Cosmetic" },
  { name: "Eye Cream", claim: "Clinically proven to erase wrinkles.", expected: "medium", category: "Cosmetic" },
  { name: "Scalp Oil", claim: "Treats psoriasis and inflammation.", expected: "high", category: "Cosmetic" },
  { name: "Baby Wash", claim: "Hypoallergenic and gentle for daily cleansing.", expected: "medium", category: "Personal Care" },

  // Medical devices and health technology
  { name: "Heart Monitor", claim: "Tracks heart-rate trends throughout the day.", expected: "low", category: "Medical Device" },
  { name: "Diagnostic Watch", claim: "Diagnoses heart disease before symptoms appear.", expected: "high", category: "Medical Device" },
  { name: "Pain Device", claim: "Eliminates chronic pain without medication.", expected: "high", category: "Medical Device" },
  { name: "Sleep Tracker", claim: "Monitors sleep duration and routine.", expected: "low", category: "Health Technology" },
  { name: "Therapy App", claim: "Replaces therapy and cures depression.", expected: "high", category: "Health Technology" },
  { name: "Posture Sensor", claim: "Provides posture reminders while you work.", expected: "low", category: "Medical Device" },
  { name: "Glucose App", claim: "Predicts and prevents diabetic emergencies.", expected: "high", category: "Health Technology" },
  { name: "Hearing Device", claim: "Clinically proven hearing performance.", expected: "medium", category: "Medical Device" },
  { name: "Compression Wrap", claim: "Supports everyday comfort during activity.", expected: "low", category: "Medical Device" },
  { name: "UV Wand", claim: "Sterilizes every surface instantly.", expected: "high", category: "Medical Device" },

  // Household, cleaning, and environmental claims
  { name: "Surface Cleaner", claim: "Removes everyday dirt and grime.", expected: "low", category: "Household Cleaner" },
  { name: "Disinfectant Spray", claim: "Kills 99.9% of bacteria and viruses.", expected: "high", category: "Household Cleaner" },
  { name: "Laundry Liquid", claim: "Leaves clothes fresh and clean.", expected: "low", category: "Household Cleaner" },
  { name: "Kitchen Spray", claim: "Non-toxic and safe for everyone.", expected: "medium", category: "Household Cleaner" },
  { name: "Bug Repellent", claim: "Prevents mosquito-borne disease.", expected: "high", category: "Pesticide" },
  { name: "Air Purifier", claim: "Eliminates airborne viruses.", expected: "high", category: "Home Appliance" },
  { name: "Trash Bags", claim: "Made with recycled plastic.", expected: "low", category: "Household Product" },
  { name: "Dish Tablets", claim: "Eco-friendly cleaning power.", expected: "medium", category: "Household Cleaner" },
  { name: "Water Filter", claim: "Removes cancer-causing contaminants.", expected: "high", category: "Home Appliance" },
  { name: "Compostable Cups", claim: "100% biodegradable in any environment.", expected: "medium", category: "Household Product" },

  // Pet and animal products
  { name: "Dog Treat", claim: "A tasty reward for good dogs.", expected: "low", category: "Pet Food" },
  { name: "Pet Joint Chew", claim: "Cures arthritis in senior dogs.", expected: "high", category: "Pet Supplement" },
  { name: "Calming Chew", claim: "Supports calm behavior during travel.", expected: "low", category: "Pet Supplement" },
  { name: "Pet Shampoo", claim: "Treats fungal infections.", expected: "high", category: "Pet Care" },
  { name: "Dental Treat", claim: "Helps reduce plaque with regular chewing.", expected: "medium", category: "Pet Food" },
  { name: "Cat Food", claim: "Complete and balanced nutrition for adult cats.", expected: "low", category: "Pet Food" },
  { name: "Flea Spray", claim: "Kills fleas and prevents infestation.", expected: "high", category: "Pet Pesticide" },
  { name: "Pet Probiotic", claim: "Supports digestive wellness.", expected: "low", category: "Pet Supplement" },
  { name: "Horse Powder", claim: "Guaranteed performance for race day.", expected: "medium", category: "Animal Supplement" },
  { name: "Bird Vitamins", claim: "FDA approved vitamins for birds.", expected: "high", category: "Animal Supplement" },

  // Baby and children's products
  { name: "Baby Blanket", claim: "Soft cotton blanket for everyday comfort.", expected: "low", category: "Baby Product" },
  { name: "Baby Monitor", claim: "Prevents SIDS while your baby sleeps.", expected: "high", category: "Baby Product" },
  { name: "Kids Vitamin", claim: "Supports normal growth and development.", expected: "low", category: "Children's Supplement" },
  { name: "Learning App", claim: "Guaranteed to make every child smarter.", expected: "medium", category: "Children's Software" },
  { name: "Toddler Snack", claim: "Made with simple ingredients.", expected: "low", category: "Children's Food" },
  { name: "Kids Cough Syrup", claim: "Cures coughs overnight.", expected: "high", category: "Drug" },
  { name: "Baby Cream", claim: "Treats eczema safely.", expected: "high", category: "Baby Product" },
  { name: "Learning Cards", claim: "Designed to support early learning.", expected: "low", category: "Children's Product" },
  { name: "Kids Toothpaste", claim: "Dentist recommended cavity protection.", expected: "medium", category: "Personal Care" },
  { name: "Child Locator", claim: "Keeps your child 100% safe.", expected: "high", category: "Consumer Electronics" },

  // Fitness, apparel, and ordinary consumer goods
  { name: "Running Shirt", claim: "High-performance fabric for daily training.", expected: "low", category: "Apparel" },
  { name: "Phone Case", claim: "Stress-tested for everyday drops.", expected: "low", category: "Consumer Electronics" },
  { name: "Yoga Mat", claim: "Supports a comfortable home practice.", expected: "low", category: "Fitness Equipment" },
  { name: "Running Shoe", claim: "Guaranteed to prevent all running injuries.", expected: "high", category: "Footwear" },
  { name: "Massage Ball", claim: "Helps ease post-workout muscle tension.", expected: "low", category: "Fitness Equipment" },
  { name: "Smart Bottle", claim: "Tracks daily water intake.", expected: "low", category: "Consumer Electronics" },
  { name: "Gym Program", claim: "Guaranteed weight loss in 14 days.", expected: "medium", category: "Fitness Service" },
  { name: "Bike Helmet", claim: "Reduces the risk of head injury when properly worn.", expected: "low", category: "Safety Equipment" },
  { name: "Desk Chair", claim: "Cures back pain while you work.", expected: "high", category: "Furniture" },
  { name: "Travel Pillow", claim: "Designed for comfortable travel.", expected: "low", category: "Consumer Product" },

  // Software, business, finance, and broad advertising claims
  { name: "Accounting App", claim: "Organize invoices and business expenses.", expected: "low", category: "Software" },
  { name: "Investment App", claim: "Guaranteed returns with zero risk.", expected: "high", category: "Financial Service" },
  { name: "Security Software", claim: "Prevents every cyberattack.", expected: "medium", category: "Software" },
  { name: "Project Tool", claim: "Helps teams organize project work.", expected: "low", category: "Software" },
  { name: "Hiring Platform", claim: "Eliminates hiring bias completely.", expected: "medium", category: "Software" },
  { name: "AI Writer", claim: "Creates a first draft in seconds.", expected: "low", category: "Software" },
  { name: "Tax Service", claim: "Guaranteed to maximize every refund.", expected: "medium", category: "Financial Service" },
  { name: "Cloud Backup", claim: "Keeps files available across your devices.", expected: "low", category: "Software" },
  { name: "Sales Platform", claim: "Clinically proven to double revenue.", expected: "medium", category: "Software" },
  { name: "Insurance Plan", claim: "Protects against unexpected covered losses.", expected: "low", category: "Financial Service" },

  // Adversarial wording, disclaimers, and mixed claims
  { name: "Standard Disclaimer", claim: "This product is not intended to diagnose, treat, cure, or prevent any disease.", expected: "low", category: "Dietary Supplement", context: "Label" },
  { name: "Soft Disease Claim", claim: "May help people living with diabetes.", expected: "high", category: "Dietary Supplement" },
  { name: "Qualified Wellness", claim: "May support occasional stress management.", expected: "medium", category: "Dietary Supplement" },
  { name: "Mixed Claim", claim: "Supports calm and cures insomnia.", expected: "high", category: "Dietary Supplement" },
  { name: "Regulatory Variant", claim: "Approved by the FDA for daily wellness.", expected: "high", category: "Dietary Supplement" },
  { name: "Scientific Variant", claim: "Scientifically proven to reverse aging.", expected: "medium", category: "Cosmetic" },
  { name: "Absolute Safety", claim: "Completely safe with no side effects.", expected: "high", category: "Dietary Supplement" },
  { name: "Comparative Claim", claim: "Works two times faster than the leading brand.", expected: "medium", category: "Cosmetic" },
  { name: "Testimonial Claim", claim: "Customers say it cured their chronic pain.", expected: "high", category: "Dietary Supplement", context: "Social media" },
  { name: "Neutral Disclaimer", claim: "Results vary and individual experiences may differ.", expected: "low", category: "Dietary Supplement", context: "Website" },
];

if (PRODUCT_REGRESSION_CASES.length !== 100) {
  throw new Error(`Regression suite must contain exactly 100 cases; found ${PRODUCT_REGRESSION_CASES.length}.`);
}
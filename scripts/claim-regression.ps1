$ErrorActionPreference = "Stop"

function Case($name, $claim, $expected, $category, $context = "Website") {
  return @{ Name = $name; Claim = $claim; Expected = $expected; Category = $category; Context = $context }
}

$cases = @(
  # Dietary supplements and wellness
  Case "Daily Collagen" "Supports healthy-looking skin, hair, and nails." "low" "Dietary Supplement"
  Case "Calm Gummies" "Treats anxiety and depression naturally." "high" "Dietary Supplement"
  Case "Glucose Capsules" "Reverses diabetes and lowers blood sugar." "high" "Dietary Supplement"
  Case "Immune Powder" "Boosts immunity throughout the year." "medium" "Dietary Supplement"
  Case "Focus Capsules" "Clinically proven to improve focus." "medium" "Dietary Supplement"
  Case "Joint Formula" "Heals arthritis and eliminates joint pain." "high" "Dietary Supplement"
  Case "Sleep Blend" "Supports a restful nighttime routine." "low" "Dietary Supplement"
  Case "Detox Tea" "A complete detox cleanse for total wellness." "medium" "Dietary Supplement"
  Case "Herbal Defense" "FDA certified herbal formula with no side effects." "high" "Dietary Supplement"
  Case "Heart Support" "Maintains general cardiovascular wellness." "low" "Dietary Supplement"

  # Food and beverages
  Case "Oat Cereal" "Made with whole grain oats." "low" "Food"
  Case "Probiotic Yogurt" "Cures digestive disease with every serving." "high" "Food"
  Case "Energy Drink" "Guaranteed energy and rapid results." "medium" "Beverage"
  Case "Kids Juice" "Prevents colds and flu in children." "high" "Beverage"
  Case "Protein Bar" "20 grams of protein per bar." "low" "Food"
  Case "Snack Pack" "Doctor recommended for every child." "medium" "Food"
  Case "Organic Coffee" "The world's best coffee." "medium" "Beverage"
  Case "Plant Milk" "Supports a balanced plant-based diet." "low" "Beverage"
  Case "Sugar-Free Candy" "100% safe for diabetics." "high" "Food"
  Case "Green Smoothie" "Miracle weight loss in seven days." "medium" "Beverage"

  # Cosmetics and personal care
  Case "Hydrating Serum" "Helps skin feel hydrated and smooth." "low" "Cosmetic"
  Case "Acne Serum" "Eradicates acne permanently." "high" "Cosmetic"
  Case "Hair Tonic" "Reverses hair loss and regrows hair." "high" "Cosmetic"
  Case "Age Serum" "Advanced anti-aging formula." "medium" "Cosmetic"
  Case "Face Cream" "Dermatologist tested for sensitive skin." "medium" "Cosmetic"
  Case "Sunscreen" "Prevents skin cancer all day." "high" "Cosmetic"
  Case "Body Lotion" "Leaves skin feeling soft." "low" "Cosmetic"
  Case "Eye Cream" "Clinically proven to erase wrinkles." "medium" "Cosmetic"
  Case "Scalp Oil" "Treats psoriasis and inflammation." "high" "Cosmetic"
  Case "Baby Wash" "Hypoallergenic and gentle for daily cleansing." "medium" "Personal Care"

  # Medical devices and health technology
  Case "Heart Monitor" "Tracks heart-rate trends throughout the day." "low" "Medical Device"
  Case "Diagnostic Watch" "Diagnoses heart disease before symptoms appear." "high" "Medical Device"
  Case "Pain Device" "Eliminates chronic pain without medication." "high" "Medical Device"
  Case "Sleep Tracker" "Monitors sleep duration and routine." "low" "Health Technology"
  Case "Therapy App" "Replaces therapy and cures depression." "high" "Health Technology"
  Case "Posture Sensor" "Provides posture reminders while you work." "low" "Medical Device"
  Case "Glucose App" "Predicts and prevents diabetic emergencies." "high" "Health Technology"
  Case "Hearing Device" "Clinically proven hearing performance." "medium" "Medical Device"
  Case "Compression Wrap" "Supports everyday comfort during activity." "low" "Medical Device"
  Case "UV Wand" "Sterilizes every surface instantly." "high" "Medical Device"

  # Household, cleaning, and environmental claims
  Case "Surface Cleaner" "Removes everyday dirt and grime." "low" "Household Cleaner"
  Case "Disinfectant Spray" "Kills 99.9% of bacteria and viruses." "high" "Household Cleaner"
  Case "Laundry Liquid" "Leaves clothes fresh and clean." "low" "Household Cleaner"
  Case "Kitchen Spray" "Non-toxic and safe for everyone." "medium" "Household Cleaner"
  Case "Bug Repellent" "Prevents mosquito-borne disease." "high" "Pesticide"
  Case "Air Purifier" "Eliminates airborne viruses." "high" "Home Appliance"
  Case "Trash Bags" "Made with recycled plastic." "low" "Household Product"
  Case "Dish Tablets" "Eco-friendly cleaning power." "medium" "Household Cleaner"
  Case "Water Filter" "Removes cancer-causing contaminants." "high" "Home Appliance"
  Case "Compostable Cups" "100% biodegradable in any environment." "medium" "Household Product"

  # Pet and animal products
  Case "Dog Treat" "A tasty reward for good dogs." "low" "Pet Food"
  Case "Pet Joint Chew" "Cures arthritis in senior dogs." "high" "Pet Supplement"
  Case "Calming Chew" "Supports calm behavior during travel." "low" "Pet Supplement"
  Case "Pet Shampoo" "Treats fungal infections." "high" "Pet Care"
  Case "Dental Treat" "Helps reduce plaque with regular chewing." "medium" "Pet Food"
  Case "Cat Food" "Complete and balanced nutrition for adult cats." "low" "Pet Food"
  Case "Flea Spray" "Kills fleas and prevents infestation." "high" "Pet Pesticide"
  Case "Pet Probiotic" "Supports digestive wellness." "low" "Pet Supplement"
  Case "Horse Powder" "Guaranteed performance for race day." "medium" "Animal Supplement"
  Case "Bird Vitamins" "FDA approved vitamins for birds." "high" "Animal Supplement"

  # Baby and children's products
  Case "Baby Blanket" "Soft cotton blanket for everyday comfort." "low" "Baby Product"
  Case "Baby Monitor" "Prevents SIDS while your baby sleeps." "high" "Baby Product"
  Case "Kids Vitamin" "Supports normal growth and development." "low" "Children's Supplement"
  Case "Learning App" "Guaranteed to make every child smarter." "medium" "Children's Software"
  Case "Toddler Snack" "Made with simple ingredients." "low" "Children's Food"
  Case "Kids Cough Syrup" "Cures coughs overnight." "high" "Drug"
  Case "Baby Cream" "Treats eczema safely." "high" "Baby Product"
  Case "Learning Cards" "Designed to support early learning." "low" "Children's Product"
  Case "Kids Toothpaste" "Dentist recommended cavity protection." "medium" "Personal Care"
  Case "Child Locator" "Keeps your child 100% safe." "high" "Consumer Electronics"

  # Fitness, apparel, and ordinary consumer goods
  Case "Running Shirt" "High-performance fabric for daily training." "low" "Apparel"
  Case "Phone Case" "Stress-tested for everyday drops." "low" "Consumer Electronics"
  Case "Yoga Mat" "Supports a comfortable home practice." "low" "Fitness Equipment"
  Case "Running Shoe" "Guaranteed to prevent all running injuries." "high" "Footwear"
  Case "Massage Ball" "Helps ease post-workout muscle tension." "low" "Fitness Equipment"
  Case "Smart Bottle" "Tracks daily water intake." "low" "Consumer Electronics"
  Case "Gym Program" "Guaranteed weight loss in 14 days." "medium" "Fitness Service"
  Case "Bike Helmet" "Reduces the risk of head injury when properly worn." "low" "Safety Equipment"
  Case "Desk Chair" "Cures back pain while you work." "high" "Furniture"
  Case "Travel Pillow" "Designed for comfortable travel." "low" "Consumer Product"

  # Software, business, finance, and broad advertising claims
  Case "Accounting App" "Organize invoices and business expenses." "low" "Software"
  Case "Investment App" "Guaranteed returns with zero risk." "high" "Financial Service"
  Case "Security Software" "Prevents every cyberattack." "medium" "Software"
  Case "Project Tool" "Helps teams organize project work." "low" "Software"
  Case "Hiring Platform" "Eliminates hiring bias completely." "medium" "Software"
  Case "AI Writer" "Creates a first draft in seconds." "low" "Software"
  Case "Tax Service" "Guaranteed to maximize every refund." "medium" "Financial Service"
  Case "Cloud Backup" "Keeps files available across your devices." "low" "Software"
  Case "Sales Platform" "Clinically proven to double revenue." "medium" "Software"
  Case "Insurance Plan" "Protects against unexpected covered losses." "low" "Financial Service"

  # Adversarial wording, disclaimers, and mixed claims
  Case "Standard Disclaimer" "This product is not intended to diagnose, treat, cure, or prevent any disease." "low" "Dietary Supplement" "Label"
  Case "Soft Disease Claim" "May help people living with diabetes." "high" "Dietary Supplement"
  Case "Qualified Wellness" "May support occasional stress management." "medium" "Dietary Supplement"
  Case "Mixed Claim" "Supports calm and cures insomnia." "high" "Dietary Supplement"
  Case "Regulatory Variant" "Approved by the FDA for daily wellness." "high" "Dietary Supplement"
  Case "Scientific Variant" "Scientifically proven to reverse aging." "medium" "Cosmetic"
  Case "Absolute Safety" "Completely safe with no side effects." "high" "Dietary Supplement"
  Case "Comparative Claim" "Works two times faster than the leading brand." "medium" "Cosmetic"
  Case "Testimonial Claim" "Customers say it cured their chronic pain." "high" "Dietary Supplement" "Social media"
  Case "Neutral Disclaimer" "Results vary and individual experiences may differ." "low" "Dietary Supplement" "Website"
)

if ($cases.Count -ne 100) {
  throw "Regression suite must contain exactly 100 cases; found $($cases.Count)."
}

function Analyze-Claim($case, [string]$claim) {
  $body = @{
    claimText = $claim
    productCategory = $case.Category
    ingredients = @("Representative ingredient")
    market = "United States FDA + FTC"
    contextType = $case.Context
  } | ConvertTo-Json

  return (Invoke-RestMethod -Uri "http://localhost:3000/api/analyze" -Method Post -ContentType "application/json" -Body $body).analysis
}

$classificationFailures = @()
$rewriteFailures = @()
$sectorResults = @{}

foreach ($case in $cases) {
  $analysis = Analyze-Claim $case $case.Claim
  $rewriteAnalysis = Analyze-Claim $case $analysis.safer_rewrite
  if (-not $sectorResults.ContainsKey($case.Category)) {
    $sectorResults[$case.Category] = @{ Total = 0; Passed = 0 }
  }
  $sectorResults[$case.Category].Total++

  if ($analysis.risk_level -ne $case.Expected) {
    $classificationFailures += "$($case.Name) [$($case.Category)]: expected $($case.Expected), got $($analysis.risk_level) - '$($case.Claim)'"
  } else {
    $sectorResults[$case.Category].Passed++
  }
  if ($case.Expected -eq "high" -and $rewriteAnalysis.risk_level -eq "high") {
    $rewriteFailures += "$($case.Name): rewrite remains high risk - '$($analysis.safer_rewrite)'"
  }
}

$classificationPassed = $cases.Count - $classificationFailures.Count
Write-Host "`n100-product regression report"
Write-Host "Classification accuracy: $classificationPassed/$($cases.Count)"
Write-Host "High-risk rewrite safety: $($cases.Where({ $_.Expected -eq 'high' }).Count - $rewriteFailures.Count)/$($cases.Where({ $_.Expected -eq 'high' }).Count)"
Write-Host "`nSector results:"
$sectorResults.GetEnumerator() | Sort-Object Name | ForEach-Object {
  Write-Host "  $($_.Name): $($_.Value.Passed)/$($_.Value.Total)"
}

if ($classificationFailures.Count) {
  Write-Host "`nClassification failures:"
  $classificationFailures | ForEach-Object { Write-Host "  $_" }
}
if ($rewriteFailures.Count) {
  Write-Host "`nRewrite failures:"
  $rewriteFailures | ForEach-Object { Write-Host "  $_" }
}

if ($classificationFailures.Count -or $rewriteFailures.Count) {
  exit 1
}

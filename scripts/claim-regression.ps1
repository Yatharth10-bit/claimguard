$ErrorActionPreference = "Stop"

$cases = @(
  @("Daily Glow Collagen", "Supports healthy skin, hair, and nails.", "low"),
  @("Calm Night Gummies", "Treats anxiety and supports deep sleep.", "high"),
  @("Sugar Balance Capsules", "Prevents diabetes naturally.", "high"),
  @("Immune Daily Powder", "Boosts immunity all year long.", "medium"),
  @("Focus Pro", "Clinically proven to improve focus.", "medium"),
  @("Slim Fast Tea", "Guaranteed weight loss in 14 days.", "medium"),
  @("Joint Comfort Plus", "Cures joint pain fast.", "high"),
  @("Evening Calm", "Supports relaxation and a calm evening routine.", "low"),
  @("Green Cleanse", "A daily detox cleanse for total wellness.", "medium"),
  @("Herbal Defense", "FDA approved herbal immune formula.", "high"),
  @("Turmeric Active", "Reduces inflammation and supports mobility.", "high"),
  @("Joint Ease Cream", "Provides natural pain relief.", "high"),
  @("Age Well Serum", "Advanced anti-aging support.", "medium"),
  @("Energy Rush", "Rapid results for athletic performance.", "medium"),
  @("Stress Less", "Daily support for occasional stress.", "medium"),
  @("Biome Balance", "Supports digestive comfort and gut health.", "medium"),
  @("Heart Daily", "Helps maintain healthy cholesterol levels.", "high"),
  @("Clear Skin Formula", "Eradicates acne in seven days.", "high"),
  @("Glucose Support", "Lowers blood sugar after every meal.", "high"),
  @("Kids Multi", "Doctor recommended nutrition for growing kids.", "medium"),
  @("Perfect Sleep", "100% effective for perfect sleep every night.", "high"),
  @("Focus Spark", "Helps support focus and sustained energy.", "low"),
  @("Oncology Herbal Blend", "Cures cancer and prevents disease recurrence.", "high"),
  @("Metabolism Miracle", "Miracle fat burn formula.", "medium"),
  @("Defense Spray", "Treatment for viral infection.", "high")
)

function Analyze-Claim([string]$claim) {
  $body = @{
    claimText = $claim
    productCategory = "Dietary Supplement"
    ingredients = @("Botanical blend")
    market = "United States FDA + FTC"
    contextType = "Website"
  } | ConvertTo-Json

  return (Invoke-RestMethod -Uri "http://localhost:3000/api/analyze" -Method Post -ContentType "application/json" -Body $body).analysis
}

$failures = @()
foreach ($case in $cases) {
  $analysis = Analyze-Claim $case[1]
  $rewriteAnalysis = Analyze-Claim $analysis.safer_rewrite

  if ($analysis.risk_level -ne $case[2]) {
    $failures += "$($case[0]): expected $($case[2]), got $($analysis.risk_level)"
  }
  if ($rewriteAnalysis.risk_level -eq "high") {
    $failures += "$($case[0]): rewrite remains high risk: $($analysis.safer_rewrite)"
  }
}

Write-Host "$($cases.Count - $failures.Count)/$($cases.Count) classifications and high-risk rewrite checks passed."
if ($failures.Count) {
  $failures | ForEach-Object { Write-Host $_ }
  exit 1
}

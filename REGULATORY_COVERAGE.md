# Regulatory Coverage

ClaimGuard uses a curated, explainable compliance knowledge layer built from official regulator guidance. It does not scrape or treat arbitrary web content as law.

## Current Coverage

- Markets: United States, European Union, United Kingdom, India, Canada, and Australia
- Official sources: 33 curated guidance and update hubs
- Regulators: 16 bodies including FTC, FDA, EPA, USDA, CPSC, TTB, CFPB, European Commission, GOV.UK, Food Standards Agency, MHRA, FSSAI, CFIA, Health Canada, TGA, and ACCC
- Product sectors: food, beverages, supplements, cosmetics, drugs, medical devices, therapeutic goods, pet and animal products, cleaners, pesticides, consumer and children's products, alcohol, tobacco, financial services, software, AI, and environmental claims
- Validation: 100 cross-sector product-claim regression cases

The source catalog is maintained in [`lib/regulatorySources.ts`](lib/regulatorySources.ts). Sector and market options are maintained in [`lib/complianceData.ts`](lib/complianceData.ts).

## Research Principles

1. Prefer official regulator guidance, regulations, and business-education pages.
2. Keep every risk signal explainable and connected to relevant official sources.
3. Apply category-specific rules where ordinary words have regulated meanings only in certain sectors.
4. Treat broad claims, certifications, scientific representations, endorsements, and environmental claims as substantiation risks.
5. Avoid presenting ClaimGuard results as legal determinations or product approvals.

## Important Limitations

- Regulations change and may differ by product formulation, intended use, audience, channel, and jurisdiction.
- A phrase-based signal can miss implied claims created by images, layout, testimonials, or surrounding context.
- Official source sync retrieves selected update hubs; the rest of the catalog is seeded as stable reference guidance to keep sync fast and reliable.
- High-risk claims and regulated product launches require review by qualified professionals.

## Adding Coverage

When adding a source:

1. Add the official source and topic tags to `lib/regulatorySources.ts`.
2. Add narrowly scoped claim signals to `lib/claimRules.ts`.
3. Connect high-risk signals to one or more source IDs.
4. Add representative low, medium, and high-risk cases to `scripts/claim-regression.ps1`.
5. Run `npm run build` and `npm run test:claims`.

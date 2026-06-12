# Rollback Notes: Personalized Flashcard Onboarding

Branch: `feat/personalized-flashcard-onboarding`  
Commit message: `feat: add personalized flashcard onboarding`

## What this feature adds

- `/onboarding` — Brand Compliance Profile Setup (10 animated flashcards)
- Personalized dashboard layer (header, risk cards, regulation feed, first-claim preview)
- Brand profile edit in Settings
- Smart "Check Your First Claim" CTA routing (login → onboarding → dashboard)

## Files created

| File | Purpose |
|------|---------|
| `lib/brandProfile.ts` | Profile types, persistence, feature flag |
| `lib/personalizedDashboard.ts` | Risk cards, regulation feed, first-claim preview |
| `hooks/useBrandProfile.ts` | React hook for load/save profile |
| `components/onboarding/onboarding-config.ts` | Flashcard questions and validation |
| `components/onboarding/OnboardingProgress.tsx` | Step progress bar |
| `components/onboarding/OnboardingFlashcard.tsx` | Single flashcard UI |
| `components/onboarding/OnboardingPage.tsx` | Full onboarding flow page |
| `components/onboarding/BrandProfileSettings.tsx` | Settings editor |
| `components/dashboard/PersonalizedDashboardLayer.tsx` | Dashboard personalization layer |
| `components/landing/CheckFirstClaimCTA.tsx` | Smart CTA link |
| `ROLLBACK_NOTES.md` | This file |

## Files modified

| File | Change |
|------|--------|
| `app/[[...slug]]/page.tsx` | Route, Dashboard layer, Auth redirects, CTA, Settings |
| `app/globals.css` | Onboarding animations |
| `middleware.ts` | Protect `/onboarding` |
| `supabase/schema.sql` | `brand_compliance_profile` jsonb column |

## Routes added

- `/onboarding` — Brand Compliance Profile Setup

## Data keys added

**localStorage** (per user):

- `claimguard-brand-profile-{userId}` — full `BrandComplianceProfile` object
- `claimguard-brand-profile-dev` — dev fallback when Supabase is not configured

**Supabase** (optional, when column exists):

- `profiles.brand_compliance_profile` — jsonb mirror of profile

## How to disable onboarding (without deleting code)

1. Open `lib/brandProfile.ts`
2. Set `BRAND_ONBOARDING_ENABLED = false`

This disables:

- Onboarding redirects from dashboard
- Personalized dashboard layer
- CTA routing to onboarding (falls back to claim checker / signup)

## How to fully revert

```bash
cd "Documents/Compliance App"
git checkout main
git branch -D feat/personalized-flashcard-onboarding
```

Or revert only onboarding files on your branch:

```bash
git checkout main -- app/[[...slug]]/page.tsx app/globals.css middleware.ts supabase/schema.sql
git rm -r components/onboarding components/dashboard components/landing/CheckFirstClaimCTA.tsx hooks/useBrandProfile.ts lib/brandProfile.ts lib/personalizedDashboard.ts ROLLBACK_NOTES.md
```

Clear browser data:

```js
Object.keys(localStorage).filter(k => k.startsWith('claimguard-brand-profile')).forEach(k => localStorage.removeItem(k));
```

## Original dashboard preserved

The existing dashboard metrics, activity feed, and risk summary are unchanged. Personalization is a **prepend layer** only — remove `PersonalizedDashboardSections` and header override in `Dashboard()` to restore the original header and layout.
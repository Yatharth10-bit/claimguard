-- Known False Negatives — regression seed + admin review queue source
-- Run after claim-intelligence-engine.sql

create table if not exists public.known_false_negatives (
  id uuid primary key default gen_random_uuid(),
  original_claim text not null,
  product_category varchar(100) not null default '',
  sector varchar(80) not null default '',
  incorrect_result varchar(20) not null default 'low',
  correct_risk_level varchar(20) not null check (correct_risk_level in ('low', 'medium', 'high', 'needs_review')),
  correct_risk_category varchar(60) not null default '',
  correct_reason text not null default '',
  safer_rewrite text not null default '',
  added_by varchar(120) not null default 'system',
  approved_for_regression_test boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists known_false_negatives_category_idx on public.known_false_negatives(product_category);
create index if not exists known_false_negatives_approved_idx on public.known_false_negatives(approved_for_regression_test) where approved_for_regression_test = true;
create index if not exists known_false_negatives_claim_trgm on public.known_false_negatives using gin (original_claim gin_trgm_ops);

drop trigger if exists set_known_false_negatives_updated_at on public.known_false_negatives;
create trigger set_known_false_negatives_updated_at before update on public.known_false_negatives
for each row execute function public.set_updated_at();

alter table public.known_false_negatives enable row level security;

-- Service role / admin API only — no user-facing select policy

insert into public.known_false_negatives (
  original_claim, product_category, sector, incorrect_result,
  correct_risk_level, correct_risk_category, correct_reason, safer_rewrite, added_by
)
select * from (values
  ('Make you white', 'Facewash', 'Skincare', 'low', 'high', 'skin_whitening_claim',
   'Skin whitening / natural skin color change implication for facewash.',
   'Gently cleanses away impurities and helps skin look fresh, clean, and radiant.', 'megaprompt-seed'),
  ('Makes your face white', 'Skincare', 'Skincare', 'low', 'high', 'skin_whitening_claim',
   'Fairness / skin tone change claim.', 'Helps skin look fresh, clean, and radiant.', 'megaprompt-seed'),
  ('Whitens skin in 7 days', 'Cosmetic', 'Skincare', 'low', 'high', 'skin_whitening_claim',
   'Rapid skin whitening with timeframe.', 'Helps brighten the appearance of dull skin over time.', 'megaprompt-seed'),
  ('Get fair skin naturally', 'Beauty', 'Skincare', 'low', 'high', 'skin_whitening_claim',
   'Fairness / natural skin tone change.', 'Supports a more even-looking complexion.', 'megaprompt-seed'),
  ('Cures inflammation', 'Dietary Supplement', 'Supplements', 'low', 'high', 'disease_treatment',
   'Disease treatment claim for supplement.', 'Supports a healthy inflammatory response.', 'megaprompt-seed'),
  ('Prevents diabetes', 'Functional Food', 'Food', 'low', 'high', 'disease_prevention',
   'Disease prevention claim for food.', 'Supports general wellness as part of a balanced diet.', 'megaprompt-seed'),
  ('Burns belly fat', 'Weight loss', 'Weight loss', 'low', 'high', 'weight_loss_claim',
   'Guaranteed fat burning claim.', 'Supports fitness goals with a balanced diet and active lifestyle.', 'megaprompt-seed'),
  ('Cures anxiety', 'Wellness', 'Wellness', 'low', 'high', 'mental_health_claim',
   'Mental health treatment claim.', 'Supports relaxation and a calm evening routine.', 'megaprompt-seed'),
  ('Boosts baby immunity', 'Baby products', 'Baby products', 'low', 'high', 'baby_medical_claim',
   'Medical immunity claim for babies.', 'Gentle for baby and designed for everyday care.', 'megaprompt-seed'),
  ('Cures dog arthritis', 'Pet products', 'Pet products', 'low', 'high', 'pet_veterinary_claim',
   'Veterinary treatment claim.', 'Supports joint comfort for everyday pet wellness.', 'megaprompt-seed'),
  ('This cured my acne', 'Skincare', 'Skincare', 'low', 'high', 'testimonial_risk',
   'Testimonial with treatment outcome.', 'Individual experiences vary; review before using in marketing.', 'megaprompt-seed')
) as v(original_claim, product_category, sector, incorrect_result, correct_risk_level, correct_risk_category, correct_reason, safer_rewrite, added_by)
where not exists (
  select 1 from public.known_false_negatives where original_claim = v.original_claim and product_category = v.product_category
);
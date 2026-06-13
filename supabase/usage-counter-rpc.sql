create or replace function public.increment_claim_scans_if_allowed(
  p_user_id uuid,
  p_period_key text,
  p_amount integer,
  p_max_scans integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  insert into public.usage_counters (user_id, period_key, claim_scans)
  values (p_user_id, p_period_key, 0)
  on conflict (user_id, period_key) do nothing;

  if p_max_scans is null then
    update public.usage_counters
    set claim_scans = claim_scans + p_amount,
        updated_at = now()
    where user_id = p_user_id and period_key = p_period_key;
    return true;
  end if;

  update public.usage_counters
  set claim_scans = claim_scans + p_amount,
      updated_at = now()
  where user_id = p_user_id
    and period_key = p_period_key
    and claim_scans + p_amount <= p_max_scans;

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;
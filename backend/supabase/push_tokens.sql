-- 9ja Health — Expo push tokens for “new health update” alerts.
--
-- Run once in the Supabase SQL Editor after health_reports.sql.
-- Safe to run again: it recreates policies and does not drop your rows.
--
-- Access model
--   - Writes / deletes: service_role only (FastAPI).
--   - No anon / authenticated client access (tokens stay server-side).

create table if not exists public.device_push_tokens (
  id           uuid primary key default gen_random_uuid(),
  -- Expo push token, e.g. ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
  token        text not null unique
               check (char_length(token) between 20 and 200),
  platform     text
               check (platform is null or platform in ('ios', 'android', 'web', 'unknown')),
  -- Soft disable when the user turns notifications off (keeps the row for re-enable).
  enabled      boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists device_push_tokens_enabled_idx
  on public.device_push_tokens (enabled)
  where enabled = true;

alter table public.device_push_tokens enable row level security;

drop policy if exists "device_push_tokens_no_client_select" on public.device_push_tokens;
drop policy if exists "device_push_tokens_no_client_insert" on public.device_push_tokens;
drop policy if exists "device_push_tokens_no_client_update" on public.device_push_tokens;
drop policy if exists "device_push_tokens_no_client_delete" on public.device_push_tokens;

-- Deny all client roles; service_role bypasses RLS.
create policy "device_push_tokens_no_client_select"
  on public.device_push_tokens for select to anon, authenticated using (false);
create policy "device_push_tokens_no_client_insert"
  on public.device_push_tokens for insert to anon, authenticated with check (false);
create policy "device_push_tokens_no_client_update"
  on public.device_push_tokens for update to anon, authenticated using (false);
create policy "device_push_tokens_no_client_delete"
  on public.device_push_tokens for delete to anon, authenticated using (false);

grant select, insert, update, delete on public.device_push_tokens to service_role;

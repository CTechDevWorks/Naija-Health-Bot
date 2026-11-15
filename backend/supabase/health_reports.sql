-- 9ja Health — daily health updates (official sources → reports feed).
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again: it recreates policies and does not drop your rows.
--
-- What this is
--   Allowlisted official sources, ingested health reports for the Updates
--   screen, and a log of each daily job run.
--
-- Access model
--   - anon / authenticated: can READ published reports and active sources.
--   - Writes (insert/update/delete): service_role only (Zapier, Edge Function,
--     or FastAPI with the service role key). Guests never write here.
--
-- After this SQL
--   POST new rows to:
--     https://<YOUR_PROJECT_REF>.supabase.co/rest/v1/health_reports
--   with the service_role key. The app lists published reports with the anon key.

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.update_sources (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique
                 check (char_length(slug) between 1 and 64),
  name           text not null
                 check (char_length(name) between 1 and 200),
  homepage_url   text not null
                 check (homepage_url ~ '^https?://'),
  feed_url       text
                 check (feed_url is null or feed_url ~ '^https?://'),
  region         text not null
                 check (region in ('nigeria', 'global')),
  priority       int not null default 100
                 check (priority between 0 and 1000),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists update_sources_active_priority_idx
  on public.update_sources (is_active, priority asc, name);

create table if not exists public.update_job_runs (
  id                  uuid primary key default gen_random_uuid(),
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  status              text not null default 'running'
                      check (status in ('running', 'success', 'partial', 'failed')),
  items_fetched       int not null default 0 check (items_fetched >= 0),
  items_inserted      int not null default 0 check (items_inserted >= 0),
  items_skipped       int not null default 0 check (items_skipped >= 0),
  error_message       text
                      check (error_message is null or char_length(error_message) <= 2000),
  -- Calendar day the job was meant for, in Africa/Lagos.
  triggered_for_date  date not null,
  created_at          timestamptz not null default now()
);

create index if not exists update_job_runs_date_idx
  on public.update_job_runs (triggered_for_date desc, started_at desc);

create table if not exists public.health_reports (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid not null
                   references public.update_sources (id) on delete restrict,
  title            text not null
                   check (char_length(title) between 1 and 300),
  summary          text not null
                   check (char_length(summary) between 1 and 4000),
  original_url     text not null
                   check (original_url ~ '^https?://'),
  -- Stable dedupe key (e.g. sha256 of a normalised URL). Prefer this over
  -- raw URL when feeds append tracking query params.
  url_hash         text not null
                   check (char_length(url_hash) between 8 and 128),
  published_at     timestamptz not null,
  ingested_at      timestamptz not null default now(),
  topic            text not null
                   check (topic in (
                     'disease',
                     'policy',
                     'vaccine',
                     'outbreak',
                     'medical_tech',
                     'guidance',
                     'other'
                   )),
  location_scope   text not null
                   check (location_scope in ('nigeria', 'west_africa', 'global')),
  urgency          text not null default 'low'
                   check (urgency in ('low', 'medium', 'high')),
  is_ai_summary    boolean not null default true,
  raw_excerpt      text
                   check (raw_excerpt is null or char_length(raw_excerpt) <= 4000),
  model_used       text
                   check (model_used is null or char_length(model_used) <= 120),
  job_run_id       uuid
                   references public.update_job_runs (id) on delete set null,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (original_url),
  unique (url_hash)
);

-- Feed order: Nigeria first, then urgency, then newest.
create index if not exists health_reports_feed_idx
  on public.health_reports (
    is_published,
    location_scope,
    urgency,
    published_at desc
  );

create index if not exists health_reports_topic_idx
  on public.health_reports (topic)
  where is_published = true;

create index if not exists health_reports_source_idx
  on public.health_reports (source_id, published_at desc);

-- ── Seed allowlisted sources ────────────────────────────────────────────────

insert into public.update_sources (slug, name, homepage_url, feed_url, region, priority)
values
  (
    'ncdc',
    'Nigeria Centre for Disease Control and Prevention',
    'https://ncdc.gov.ng/',
    null,
    'nigeria',
    10
  ),
  (
    'fmohsw',
    'Federal Ministry of Health and Social Welfare',
    'https://health.gov.ng/',
    null,
    'nigeria',
    20
  ),
  (
    'nphcda',
    'National Primary Health Care Development Agency',
    'https://nphcda.gov.ng/',
    null,
    'nigeria',
    30
  ),
  (
    'nmep',
    'National Malaria Elimination Programme',
    'https://www.nmep.gov.ng/',
    null,
    'nigeria',
    40
  ),
  (
    'who',
    'World Health Organization',
    'https://www.who.int/',
    'https://www.who.int/rss-feeds/news-english.xml',
    'global',
    100
  ),
  (
    'who-afro',
    'WHO Regional Office for Africa',
    'https://www.afro.who.int/',
    null,
    'global',
    110
  )
on conflict (slug) do nothing;

-- ── Access ──────────────────────────────────────────────────────────────────

alter table public.update_sources   enable row level security;
alter table public.health_reports   enable row level security;
alter table public.update_job_runs  enable row level security;

-- Job runs stay private (ops only via service_role).
revoke all on public.update_job_runs from anon, authenticated;

-- Public can read active sources and published reports; nobody public writes.
revoke insert, update, delete on public.update_sources from anon, authenticated;
revoke insert, update, delete on public.health_reports from anon, authenticated;

grant select on public.update_sources to anon, authenticated;
grant select on public.health_reports to anon, authenticated;

drop policy if exists update_sources_public_read on public.update_sources;
create policy update_sources_public_read
  on public.update_sources
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists health_reports_public_read on public.health_reports;
create policy health_reports_public_read
  on public.health_reports
  for select
  to anon, authenticated
  using (is_published = true);

-- service_role bypasses RLS, so Zapier / Edge Functions / FastAPI can insert
-- with the service role key without extra write policies.

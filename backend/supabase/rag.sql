-- 9ja Health — shared malaria knowledge base (RAG).
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again: it recreates policies, functions and the embed trigger,
-- and does not drop your rows.
--
-- What this is
--   Curated passages from backend/knowledge_base/RAGInfo/, embedded with the
--   free gte-small model (384 dimensions) and searched by meaning.
--
-- What protects the data
--   Row-level security is on. The anon and authenticated roles cannot read or
--   write these tables. Only the service_role key (used by the FastAPI server
--   and by the edge functions below) can. Guests of the app never talk to
--   these tables directly.
--
-- After this SQL
--   1. Deploy the edge functions in backend/supabase/functions/ (see README).
--   2. Put SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in
--      backend/.env (and on Render).
--   3. From the backend folder run:  python -m scripts.load_knowledge

create extension if not exists vector with schema extensions;
create extension if not exists pg_net with schema extensions;

create schema if not exists private;

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.kb_documents (
  id           text primary key,                 -- file stem, e.g. "02-symptoms"
  title        text not null,
  topic        text not null default '',
  region       text not null default '',
  status       text not null default 'draft',
  updated_at   timestamptz not null default now()
);

create table if not exists public.kb_sections (
  -- Stable key: "<document>/<heading-slug>"
  id              text primary key,
  document_id     text not null references public.kb_documents (id) on delete cascade,
  heading         text not null,
  content         text not null check (char_length(content) between 1 and 4000),
  -- Source ids from knowledge_base/sources.json, e.g. ["who-malaria"].
  source_ids      text[] not null default '{}',
  -- Hash of the text that was embedded; when it changes the embedding is cleared.
  content_hash    text not null,
  embedding       extensions.vector(384),
  updated_at      timestamptz not null default now()
);

create index if not exists kb_sections_document_idx
  on public.kb_sections (document_id);

-- Inner-product index; embeddings are length-normalised so this matches cosine.
create index if not exists kb_sections_embedding_idx
  on public.kb_sections
  using hnsw (embedding extensions.vector_ip_ops);

-- ── Access ──────────────────────────────────────────────────────────────────

alter table public.kb_documents enable row level security;
alter table public.kb_sections  enable row level security;

revoke all on public.kb_documents from anon, authenticated;
revoke all on public.kb_sections  from anon, authenticated;
-- service_role bypasses RLS; no grant to the public roles is intentional.

-- ── Similarity search ───────────────────────────────────────────────────────

create or replace function public.match_kb_sections(
  query_embedding extensions.vector(384),
  match_threshold float default 0.5,
  match_count     int   default 4
)
returns table (
  id          text,
  document_id text,
  heading     text,
  content     text,
  source_ids  text[],
  similarity  float
)
language sql
stable
as $$
  select
    s.id,
    s.document_id,
    s.heading,
    s.content,
    s.source_ids,
    -- Embeddings are length-normalised, so -(a <#> b) is cosine similarity.
    (-(s.embedding <#> query_embedding))::float as similarity
  from public.kb_sections s
  where s.embedding is not null
    and s.embedding <#> query_embedding < -match_threshold
  order by s.embedding <#> query_embedding
  limit greatest(match_count, 1);
$$;

revoke all on function public.match_kb_sections(extensions.vector, float, int)
  from public, anon, authenticated;
-- Callable with the service role key only (PostgREST / edge functions).

-- ── Project URL helper (for the embed trigger) ──────────────────────────────
-- Stores nothing secret. The edge function URL is built from the project URL
-- which you set once as a Vault secret named "supabase_url", or we fall back
-- to the request host when that secret is missing.

create or replace function private.supabase_url()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_value text;
begin
  begin
    select decrypted_secret into secret_value
      from vault.decrypted_secrets
     where name = 'supabase_url';
  exception
    when undefined_table then
      secret_value := null;
    when others then
      secret_value := null;
  end;
  return secret_value;
end;
$$;

-- ── Embed newly inserted / changed sections ─────────────────────────────────
-- Calls the "rag-embed" edge function in batches. The function reads rows whose
-- embedding is null, runs gte-small, and writes the vectors back.

create or replace function private.embed_kb_sections()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_url text := private.supabase_url();
  batch_size int := 8;
  ids text[];
  i int;
  chunk text[];
begin
  if base_url is null or base_url = '' then
    -- Vault secret not set yet; the loader can call the edge function itself.
    return null;
  end if;

  select array_agg(id) into ids from inserted where embedding is null;
  if ids is null then
    return null;
  end if;

  for i in 0 .. (ceiling(array_length(ids, 1)::float / batch_size) - 1) loop
    chunk := ids[(i * batch_size + 1) : least((i + 1) * batch_size, array_length(ids, 1))];
    perform net.http_post(
      url := base_url || '/functions/v1/rag-embed',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', coalesce(
          current_setting('request.headers', true)::json ->> 'authorization',
          ''
        )
      ),
      body := jsonb_build_object('ids', to_jsonb(chunk)),
      timeout_milliseconds := 300000
    );
  end loop;
  return null;
end;
$$;

drop trigger if exists embed_kb_sections on public.kb_sections;
create trigger embed_kb_sections
  after insert on public.kb_sections
  referencing new table as inserted
  for each statement
  execute function private.embed_kb_sections();

-- 9ja Health — saved assistant conversations.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- It is safe to run again; nothing is dropped except the policies and trigger
-- it recreates.
--
-- What protects the data
--   Row-level security is on for both tables. A signed-in user can only reach
--   rows whose user_id is their own, and only when their session passed the
--   authenticator-app step (the token's "aal" claim is "aal2"). A password-only
--   session, or a guest, can read and write nothing here.
--
-- What does not
--   Message text is stored as plain text. Anyone with access to this Supabase
--   project's dashboard or database password can read it.

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  -- Filled in from the caller's token; the app and API never send it.
  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  -- A counter, so messages saved together still have a definite order.
  id               bigint generated always as identity primary key,
  conversation_id  uuid not null
                   references public.conversations (id) on delete cascade,
  user_id          uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null check (char_length(content) between 1 and 20000),
  -- True when the reply was the emergency / urgent-care message.
  urgent           boolean not null default false,
  -- Which safety rule produced the reply, when one did (e.g. 'off_topic').
  guardrail        text check (guardrail is null or char_length(guardrail) <= 40),
  -- The approved references shown under the reply: [{id, title, organisation, url}].
  sources          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, id);

-- ── Keep "last updated" current ─────────────────────────────────────────────
-- Runs as the user who inserted the message, so the policies below still apply.

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ── Access ──────────────────────────────────────────────────────────────────

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- Guests (the "anon" role) get nothing. Signed-in users get table access, and
-- the policies decide which rows.
revoke all on public.conversations from anon;
revoke all on public.messages      from anon;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, delete         on public.messages      to authenticated;

drop policy if exists "Own conversations, two-factor sessions only" on public.conversations;
create policy "Own conversations, two-factor sessions only"
  on public.conversations
  for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select auth.jwt() ->> 'aal') = 'aal2'
  )
  with check (
    (select auth.uid()) = user_id
    and (select auth.jwt() ->> 'aal') = 'aal2'
  );

drop policy if exists "Read own messages, two-factor sessions only" on public.messages;
create policy "Read own messages, two-factor sessions only"
  on public.messages
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select auth.jwt() ->> 'aal') = 'aal2'
  );

-- A message can only be added to a conversation the same user owns.
drop policy if exists "Add messages to own conversations, two-factor sessions only" on public.messages;
create policy "Add messages to own conversations, two-factor sessions only"
  on public.messages
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1
        from public.conversations c
       where c.id = conversation_id
         and c.user_id = (select auth.uid())
    )
  );

drop policy if exists "Delete own messages, two-factor sessions only" on public.messages;
create policy "Delete own messages, two-factor sessions only"
  on public.messages
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select auth.jwt() ->> 'aal') = 'aal2'
  );

-- There is deliberately no update policy on messages: saved messages cannot be
-- edited, only deleted (deleting a conversation deletes its messages).

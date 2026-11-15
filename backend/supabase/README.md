# Supabase setup for 9ja Health

SQL files, run in the Supabase SQL Editor:

| File | What it creates |
|---|---|
| `chat_history.sql` | Saved conversations (accounts + two-factor) |
| `rag.sql` | Malaria knowledge tables + similarity search |
| `health_reports.sql` | Daily Updates feed (`update_sources`, `health_reports`, job log) |

## RAG edge functions

After `rag.sql` has run:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you do not have it.
2. From this folder (`backend/supabase`):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy rag-embed --no-verify-jwt
npx supabase functions deploy rag-query --no-verify-jwt
```

`--no-verify-jwt` is intentional: the FastAPI server calls these with the
**service_role** key. The tables themselves refuse anon and authenticated
access, so the key is what protects the knowledge base.

3. Optional but useful for the database embed trigger: in SQL Editor run

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'supabase_url');
```

(Use your real project URL.) If you skip this, `python -m scripts.load_knowledge`
still embeds everything by calling `rag-embed` itself.

## Load the knowledge files

From `backend/`, with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set:

```bash
python -m scripts.load_knowledge --dry-run
python -m scripts.load_knowledge
```

Re-run the loader whenever you edit files under `knowledge_base/RAGInfo/documents/`.
Sections marked `Source: PENDING` are never loaded.

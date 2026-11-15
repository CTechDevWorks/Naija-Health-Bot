# RAGInfo: malaria knowledge base for 9ja Health

Draft passages the assistant retrieves. They have **not** been reviewed by a
qualified health professional and must not be treated as finished medical
content.

## Layout

| Path | Loaded into RAG? |
|---|---|
| `documents/01-…` to `20-…` | Yes, except sections marked `Source: PENDING` |
| `sources.json` | Citation registry (merged into `../sources.json` for the API) |
| `held-back/environmental-action-rules.yaml` | No — for the prevention feature later |

## Format

See any file under `documents/`. One `## heading` + body + `Source: id1, id2`
is one passage. `Source: PENDING` means the section is kept for later and
**never** loaded.

## Current state

- Sourced sections are loaded by `python -m scripts.load_knowledge`.
- A few sections are still `Source: PENDING` (search the folder). They stay out
  of the live knowledge base until a real source is attached.
- Your ISBN links were added under their real titles:
  - `9789240123212` → larval source management manual (`who-lsm-manual`)
  - `9789241513166` → housing improvements for vector control (`who-housing-vector`)
  - Nigeria 2024 country profile PDF → `who-nga-malaria-profile-2024`
- The consolidated **WHO guidelines for malaria** still need their own link if
  you want guideline-level citations; those two ISBNs are not that document.

## Before going live

1. Finish or delete the remaining `PENDING` sections.
2. Have a qualified health professional review every document.
3. Run the SQL and loader steps in `backend/supabase/README.md`.

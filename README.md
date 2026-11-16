# 9ja Health

**AI-powered malaria awareness and health intelligence for Nigeria — mobile-first, source-grounded, and built for everyday use.**

9ja Health helps people understand malaria risk in context, take practical prevention steps, and get **trustworthy answers** from a curated knowledge base — without replacing doctors or guessing personal diagnoses.

**Origins.** The product grew from the **Veritas AI International High School Hackathon (Health track)** — team **Neuraxis** (Olumide-Olaiya Samuel, Coker Oluwatoniloba). The mobile app and backend extend that work into a deployable stack; the malaria **forecasting research** below is the scientific foundation for **Prevention** (Outlook uses the same datasets as trends only).

---

## Why this matters

Malaria still kills more than **600,000 people per year** worldwide, mostly in sub-Saharan Africa. Nigeria carries one of the largest burdens of disease on the continent — across **all 36 states and the FCT**. At the same time:

- **Communities** need clear, sourced guidance; **planners and clinics** need foresight into incidence trends to allocate nets, treatment stock, and campaigns.
- **Misinformation spreads faster than clinics can respond.** People search symptoms online, buy the wrong medicines, or delay testing.
- **Transmission follows weather, history, and place**, but most apps either show raw forecasts or generic articles — not a joined-up, area-level story.
- **Official guidance exists** (WHO, NMEP, NCDC) but is scattered across PDFs, portals, and news sites that few people read end-to-end.

9ja Health is aimed at that gap: **actionable, honest information** for people living in Nigeria, with strict safety boundaries and named sources — the same need that global health programmes emphasise for digital health in LMICs, applied to one high-impact disease first.

---

## The problem → our response

| Problem | What 9ja Health does |
|--------|----------------------|
| People need malaria facts they can trust, not model hallucinations | **Retrieval-augmented assistant (RAG)** over a curated knowledge base (WHO and allied sources), loaded into Supabase; answers are blocked if nothing relevant is retrieved |
| Chatbots often diagnose, dose, or wander off-topic | **Server-side guardrails**: malaria-only scope, no dosing, medicine names limited to retrieved text; off-topic and unsafe prompts refused |
| “Risk” apps imply personal predictions | **Area-level framing only** — population patterns and environment, never “you have malaria” |
| Weather affects mosquitoes but users do not see the link | **Live local weather** on Home via **OpenWeather**; Outlook rainfall from **NASA POWER** yearly series |
| Planners / users lack simple incidence foresight | **Outlook** = dataset trends (MAP + NASA POWER). **Prevention** = trained gradient-boosting estimate + rule-based tips via `POST /api/v1/prevention` |
| Health news is noisy | **Updates** feed: allowlisted scrape → AI write-up → Supabase → `GET /api/v1/health-reports`; optional **Expo push** when new rows publish |
| Secrets and keys must not live in the app | **FastAPI backend** holds LLM and Supabase service keys; the Expo app only calls `EXPO_PUBLIC_*` values |

---

## Current product status (as of this README)

Bottom tabs: **Home · Outlook · Prevention · Assistant · Updates**. **Profile** (and optional **Account**) open from the Home avatar.

| Screen | What works today | Needs config / still open |
|--------|------------------|---------------------------|
| **Home** | GPS → Nigerian state, live OpenWeather strip (temp, feels-like, humidity, rain, wind, cloud cover), outlook teaser, prevention & updates shortcuts, assistant entry | `EXPO_PUBLIC_OPENWEATHER_API_KEY`; location permission or manual state |
| **Outlook** | State/FCT **incidence line chart** (MAP) vs Nigeria average, **rainfall bars** (NASA POWER), insight cards, honest “not personal risk” copy | Bundled `src/data/outlook.json` (rebuild via `npm run build:outlook-data`) |
| **Prevention** | Trained **gradient boosting** report: incidence, category, period, factors, rule-based tips | `EXPO_PUBLIC_API_BASE_URL`; backend loads `backend/ml/model.joblib` |
| **Assistant** | Live chat to FastAPI; RAG + guardrails; guests OK; signed-in users save history | `EXPO_PUBLIC_API_BASE_URL` + BluesMinds + Supabase RAG |
| **Updates** | Pull-to-refresh feed of published AI write-ups + official authority directory | Backend + Supabase `health_reports`; optional push tokens SQL |
| **Profile** | Location, larger text, notifications (push + in-app reminder), privacy/about, explore removed | Push needs physical device + `push_tokens.sql` |
| **Account** | Optional Supabase email/password + TOTP | `EXPO_PUBLIC_SUPABASE_*` + backend Supabase keys |

**Safety (non-negotiable):** not a diagnostic tool; emergencies → **112** in Nigeria; no prescriptions or dosing; medical copy should be reviewed before wide release.

---

## Architecture

```mermaid
flowchart LR
  subgraph mobile["Expo app (naija-health-bot)"]
    GPS[GPS / state picker]
    OWM[OpenWeather]
    UI[Tabs UI]
    Bundled[outlook.json MAP + POWER]
    GPS --> UI
    OWM --> UI
    Bundled --> UI
    UI --> API[HTTPS]
  end

  subgraph backend["FastAPI backend"]
    API --> Chat[Chat + guardrails]
    Chat --> RAG[rag-query / Supabase]
    Chat --> LLM[BluesMinds LLM]
    Jobs[Daily updates job] --> Store[(Supabase)]
    Jobs --> Push[Expo Push API]
    RAG --> KB[(kb_documents / kb_sections)]
  end

  subgraph research["Malaria ML (hackathon research)"]
    MAP[Malaria Atlas Project Trends]
    NASA[NASA POWER weather]
    MAP --> ML[Gradient boosting change model]
    NASA --> ML
  end

  ML --> API
```

**Knowledge base:** Markdown sections under `backend/knowledge_base/RAGInfo/documents/`, loaded with `python -m scripts.load_knowledge`. SQL and edge functions: `backend/supabase/README.md`.

---

## Features in detail

This section explains **each major feature** as it exists in the repo, including the technical path end-to-end.

### 1. Location → Nigerian state

**User-facing.** On launch (and on refresh), the app asks for **foreground** location only. If granted, Home shows the resolved state (e.g. “Lagos”) and wires weather + Outlook to that area. If denied, outside Nigeria, or unresolved, the UI offers a **manual picker** of all 36 states + FCT.

**Technical path.**

1. `expo-location` → `requestForegroundPermissionsAsync` / `getCurrentPositionAsync` (`Accuracy.Balanced`) in `src/services/locationService.ts`.
2. Coordinates are reverse-geocoded with **BigDataCloud**’s free client endpoint (`reverse-geocode-client`) — no API key.
3. Response `principalSubdivision` (and fallbacks) is matched against the canonical list in `src/constants/nigeriaStates.ts` (`matchNigerianState`).
4. Country code must be `NG`; otherwise `LocationServiceError` with code `outside_nigeria`.
5. Manual picks use **state-capital centroids** from the same constants file so weather still has a lat/lon.
6. State is held in `EnvironmentProvider` (`src/hooks/useEnvironment.tsx`): location is shown **before** weather finishes so the UI never looks blank while OpenWeather loads.

**Privacy note.** Only foreground GPS; no background tracking. Preference copy lives under Profile → Privacy.

---

### 2. Live weather (OpenWeather)

**User-facing.** Home **Weather strip** shows temperature, feels-like, humidity, rainfall, wind, cloud cover, a short summary, source label, and last-updated time. Refresh re-requests GPS + weather. Prevention and Outlook also read the same snapshot when present.

**Technical path.**

1. Key: `EXPO_PUBLIC_OPENWEATHER_API_KEY` in `naija-health-bot/.env` (baked into the JS bundle — fine for a free demo key; production should proxy).
2. `fetchCurrentWeather` in `src/services/weatherService.ts` calls  
   `GET https://api.openweathermap.org/data/2.5/weather?lat=&lon=&appid=&units=metric`.
3. Client uses a **hard Promise.race timeout** (~12s) plus `AbortController` so a hung network cannot spin forever (earlier Open-Meteo attempts hung on some Nigerian networks).
4. Mapping: `main.temp` / `feels_like` / `humidity`, `wind.speed` (m/s → km/h × 3.6), `rain.1h` or `rain.3h`, `clouds.all`, `weather[0].description`, `dt` → ISO.
5. HTTP **401** / **429** surface clear messages (bad key / rate limit). Missing key fails fast with setup instructions.
6. UI: `WeatherStrip`, `OutlookCard` teaser; status machine in `useEnvironment`: `loading` | `ready` | `needs_manual` | `weather_error` | `error`.

---

### 3. Outlook (area trends + rainfall)

**User-facing.** For the selected state/FCT: insight chips (latest incidence, 5-year change, vs Nigeria), a **line chart** of estimated cases per 1,000 people (area vs national average), and a **bar chart** of yearly rainfall. Copy repeatedly states this is **not personal risk**.

**Technical path.**

1. Data is **bundled** at build/dev time in `src/data/outlook.json` (MAP incidence + NASA POWER climate + national average series). Regenerated by:

   ```sh
   cd naija-health-bot
   npm run build:outlook-data   # runs scripts/build-outlook-data.py over nasa_power_yearly/ CSVs
   ```

2. `getOutlookForState` / `computeInsights` / `climateForIncidenceYears` in `src/services/outlookData.ts` select the state slice and derive peak year, 5-year % change, and vs-national delta.
3. Charts are custom **react-native-svg** components (`IncidenceTrendChart`, `RainfallTrendChart`):
   - Width from **`onLayout`** (not screen width guesses) so bars/lines stay inside the card.
   - X-axis labels are **thinned** by pixel budget so years do not mash together.
   - Incidence Y-axis uses **nice ticks**; rainfall highlights wettest/latest years in meta text.
4. Research Random Forest models (below) are **not yet** a live prediction API; Outlook today is **historical / observational** visualisation of the same data families used in the hackathon study.

---

### 4. Prevention (trained model home)

**User-facing.** This tab is where **all trained-model outputs** appear: incidence/likelihood, category, period, factors, and tips from the rules engine. Weather context is shown when available. When the API is reachable, the report card fills from the gradient-boosting model; if the call fails, the static tip checklist remains as fallback guidance.

**Technical path.**

1. UI: `src/app/prevention.tsx` + `src/services/preventionApi.ts`.
2. `POST /api/v1/prevention` with `{ latitude, longitude, state }` → feature builder (previous-year NASA POWER + MAP) → gradient boosting change model → incidence reconstruction → quartile category → deterministic tips (`backend/services/prevention_rules.py`).
3. Outlook does **not** consume ML inference.

---

### 5. Assistant (RAG chat + guardrails)

**User-facing.** Chat tab with starter prompts, streaming-style busy state, source links on answers, emergency copy when triggered, optional sign-in to save conversations.

**Technical path (request lifecycle).**

```text
App askAssistant()
  → POST /api/v1/chat  { messages[], conversation_id? }  + optional Bearer JWT
  → backend services/chat_service.answer()
       1. Sanitise transcript (roles, length, history cap)
       2. Input guardrails (emergency / self-harm / injection / “live weather|news|outlook” → app referral)
       3. Topic / pleasantry checks
       4. RAG retrieve (Supabase edge rag-query, cosine threshold + top-k)
       5. If no passages → fixed “no knowledge” reply (no free-form LLM inventing malaria facts)
       6. BluesMinds chat completion with system prompt + passages + source id rules
       7. Output guardrails: scope (malaria vs other vs app), dosage ban, medicine allow-list from retrieved text
       8. Strip unapproved URLs; attach approved Source objects
       9. Optional history write if authenticated
  ← { response, model, guardrail, urgent, sources, conversation_id, saved }
```

**Key modules.**

| Piece | Location |
|-------|----------|
| Mobile client | `src/services/assistantApi.ts` |
| Pipeline | `backend/services/chat_service.py` |
| Input guardrails | `backend/guardrails/scope.py` (+ topic / medicines / output) |
| Retrieval | `backend/services/retrieval.py` → Supabase `rag-query` |
| LLM | `backend/ai/bluesminds.py` — primary model + ordered fallbacks |
| Rate limits | Per-IP anon + tighter limits for authed history routes |
| System prompt | `backend/prompts/system_prompt.md` (cached) |

**Auth.** Guests chat freely. With Supabase configured, email/password + **TOTP** (`src/app/account.tsx`, `useAuth`). Access token is sent only for chat/history; **service_role never ships in the app**.

---

### 6. Updates (daily official briefings)

**User-facing.** Updates tab loads up to **5** published write-ups (title, AI summary, topic, date, link to original). Pull-to-refresh. Below: directory of NCDC / FMOH / NPHCDA-style authorities.

**Technical path.**

1. **Ingest job** `POST /api/v1/jobs/daily-health-updates` with header `X-Job-Secret` (`UPDATES_JOB_SECRET`), or in-process scheduler ~**07:00 Africa/Lagos** when enabled on Render (`UPDATES_SCHEDULER_ENABLED` / `RENDER_EXTERNAL_URL`).
2. Pipeline (`backend/services/reports_pipeline.py`):
   - Load active rows from `update_sources` (priority-ordered allowlist).
   - Scrape feeds/pages (`reports_scraper`).
   - Dedupe by `url_hash`.
   - Prefer Nigeria-first sources (NCDC, FMOHSW, NPHCDA, NMEP, then WHO).
   - AI summarise each new article (`reports_summarizer`) into title/summary/topic/urgency/location_scope.
   - Insert `health_reports` with `is_published=true`.
   - If `items_inserted > 0`, call **Expo Push** notify (`push_notify.py`).
3. App: `GET /api/v1/health-reports?limit=` via `src/services/healthReportsApi.ts` → `src/app/updates.tsx`.
4. SQL: `backend/supabase/health_reports.sql`.

---

### 7. Push notifications (new health updates)

**User-facing.** Profile → Notifications → **New health updates**. Opt-in requests OS permission; tapping a notification opens the Updates tab.

**Technical path.**

1. Mobile: `expo-notifications` + `expo-device`; token via `getExpoPushTokenAsync` (`src/services/pushNotifications.ts`). Preference persisted in AsyncStorage.
2. `POST /api/v1/push-tokens` `{ token, platform, enabled }` upserts `device_push_tokens` (service_role only; RLS denies anon). SQL: `backend/supabase/push_tokens.sql`.
3. On publish, backend batches Expo Push API (`https://exp.host/--/api/v2/push/send`) with `data.screen = "updates"`. Stale `DeviceNotRegistered` tokens are soft-disabled.
4. Requires a **physical device** (simulators/web are limited). Restart Expo after enabling the notifications plugin in `app.json`.

---

### 8. Accounts & conversation history

**User-facing.** Optional account for saving chats; list/open/delete conversations from Profile.

**Technical path.**

1. Supabase Auth in the app (`src/services/supabase.ts` — anon key only).
2. Backend verifies JWT and uses the user’s token (or service patterns documented in `auth/`) for row-level access to history tables (`chat_history.sql`).
3. Routes: `GET/DELETE /api/v1/conversations`, `GET /api/v1/conversations/{id}` (`backend/api/conversations.py`, `services/history.py`).
4. Chat may attach `conversation_id` so turns append to the same thread when `saved: true`.

---

### 9. Design system & shell

**User-facing.** Light-only cream/green brand (`#7DBA84` / `#F5ECD4` / `#232323`), Inter, shared buttons/cards/sheets.

**Technical path.** Tokens in `src/constants/designTokens.ts`; primitives in `src/components/healthUi.tsx`; icons via `expo-symbols` (`healthIcon.tsx`). Tab shell: `app-tabs.tsx` / `appShell.tsx`. Product/design briefs: `prompts-and-guides/`.

---

### 10. Backend platform concerns

| Concern | Implementation |
|---------|----------------|
| Config | `backend/config.py` + `.env` (never commit secrets) |
| CORS | `ALLOWED_ORIGINS` includes Expo web ports 8081–8083 |
| Keep-alive | Self-ping `/api/v1/health` on Render so free tier does not sleep |
| Health | `GET /api/v1/health` reports provider, model, `configured`, `accounts`, `rag` |
| Docs | OpenAPI at `/docs` |

---

## Malaria modelling (Prevention research)

Team **Neuraxis** (Olumide-Olaiya Samuel, Coker Oluwatoniloba) — Veritas AI International High School Hackathon, Health track. **Disclaimer:** this is a prototype for educational and hackathon demonstration purposes and does **not** constitute formal medical or public-health advice. It is **not** a validated forecasting system for operational planning.

All trained-model outputs feed the **Prevention** screen via `POST /api/v1/prevention`. **Outlook** only visualises the underlying MAP + POWER yearly series as observational trends — it does not run ML inference.

### The problem

Malaria remains a major public-health challenge across Nigeria’s **36 states and the FCT**. Planners and clinics need foresight into **annual incidence** trends to allocate mosquito-control resources, treatment supplies, and education. Anticipating change is hard because transmission depends on interacting factors — environment, historical transmission, and public-health interventions.

### What we built

A machine-learning prototype that estimates **annual clinical *Plasmodium falciparum* incidence** (cases per **1,000** population) for Nigeria’s **37** administrative areas. The work asks whether combining **environmental information** with **historical malaria incidence** improves predictions versus environment alone. Intended use: data-informed estimates that could support planning and awareness. Resolution is **state/FCT only** — not individual or neighbourhood risk.

### How it works

**Data.** We combined **962** state-level incidence records from [MAP Trends](https://malariaatlas.org/) (**2000–2025**) with daily [NASA POWER](https://power.larc.nasa.gov/) weather for 37 areas. Temperature, rainfall, humidity, and wind were aggregated to **annual** values and paired with the **following year’s** incidence.

**Models (scikit-learn).**

- **Model 1** — Random Forest: state identity + previous-year weather.
- **Model 2** — Random Forest: Model 1 + previous-year incidence in the same state.
- **Model 3** — Ridge and **Model 4** — Gradient Boosting: predict the **change** in incidence, then add it to the previous year (`previous_incidence + predicted_change`) rather than estimating the level from scratch.

**Evaluation.** Chronological split with no leakage: train **2001–2015**, validate **2016–2020**, hold-out test **2021–2025**. Compared with an **average** baseline and a **previous-year** baseline (MAE, RMSE, R²).

### Results and performance (hold-out 2021–2025)

| Approach | MAE | RMSE | R² |
|----------|-----|------|-----|
| Average baseline | 99.756 | 110.416 | −1.708 |
| Previous-year baseline | **19.245** | **25.442** | **0.856** |
| Model 1: state + weather | 79.815 | 98.085 | −1.137 |
| Model 2: state + weather + previous incidence | 20.725 | 26.863 | 0.840 |
| Model 3: Ridge (change) | 22.513 | 30.653 | 0.791 |
| **Model 4: Gradient Boosting (change)** — **served in app** | **20.258** | **26.092** | **0.84** |

**Finding.** Adding previous-year malaria incidence dramatically improved the Random Forest, but it still performed slightly worse than simply carrying last year’s incidence forward. Gradient boosting and Ridge showed no major breakthrough beyond that. **Gradient boosting is the best of the four models** and is what the app serves — and it **still cannot pass the previous-year baseline**. With this setup, annual environmental features provided no demonstrated extra predictive advantage over history.

### Where it fails

- **State/FCT only** — cannot identify localised outbreaks or within-state community differences.
- Model 1 struggles without historical malaria; none of the four models beat the previous-year baseline.
- Climate is **one point per state**; **annual** averages hide **seasonal** patterns.
- No covariates yet for healthcare access, mosquito-control interventions, ITN coverage, or case management.
- **Not** individual risk; **not** for diagnosis or treatment decisions.

### What we’d do next

- Monthly / **LGA-level** surveillance where available.
- **Seasonal** rainfall and temperature features instead of yearly means only.
- Public-health intervention data (nets, access, prevention programmes).
- Alternative regression and time-series algorithms.
- Broader validation across places and periods before any real-world deployment.

### Sources and technologies

- **Data:** MAP Trends (state-level incidence, 2000–2025); NASA POWER API (daily meteorology).
- **Stack:** Python, pandas, NumPy, scikit-learn; Colab / Drive for the research notebook.
- **AI assistance:** ChatGPT and Gemini helped with programming, debugging, and understanding parts of the workflow. The team reviewed and tested the code and evaluated the models.

### In the live app

- **OpenWeather** powers “weather now” on Home / Prevention context (not model input).
- **Outlook** uses bundled MAP + POWER history charts.
- **Prevention** calls `POST /api/v1/prevention` with GPS + resolved state. The backend builds previous-year NASA POWER + MAP features, runs the packaged **gradient boosting** change model, reconstructs incidence, assigns a quartile **category** (model band, not clinical), and returns deterministic prevention tips. Artefacts: `backend/ml/model.joblib`, `backend/ml/model_metadata.json` (retrain with `python -m scripts.train_prevention_model` from `backend/`).

---

## Repository layout

```text
naija-health-bot/          React Native + Expo Router mobile app (SDK 58)
  src/app/                 Screens (tabs + profile / account)
  src/services/            Weather, location, assistant, reports, push, outlook data
  src/components/          Shared UI, weather strip, location picker, outlook charts
  src/data/outlook.json    Bundled MAP + NASA POWER series for Outlook
  src/hooks/               Auth, environment, prototype session, update push
  scripts/                 build-outlook-data.py
backend/                   FastAPI service (e.g. Render)
  api/                     chat, prevention, health, conversations, health-reports, jobs, push-tokens
  ml/                      Packaged gradient boosting model + metadata + feature builder
  guardrails/              Input/output safety
  services/                RAG, chat, prevention, reports pipeline, push notify, scheduler, keep-alive
  knowledge_base/          Approved sources + RAG document corpus
  supabase/                SQL (chat, rag, health_reports, push_tokens) + edge functions
  scripts/                 load_knowledge, train_prevention_model, run_daily_updates, refresh_feed_writeups
nasa_power_yearly/         MAP incidence + NASA POWER yearly CSVs (Outlook + Prevention features)
prompts-and-guides/        Product, design, checklist, engineering reference
```

---

## Quick start

### Mobile app

Requirements: Node.js compatible with **Expo SDK 58**, npm.

```sh
cd naija-health-bot
npm ci
cp .env.example .env    # set keys below
npx expo start          # Expo Go on device, or press w for web
```

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend root, e.g. `http://127.0.0.1:8000` or your Render URL |
| `EXPO_PUBLIC_OPENWEATHER_API_KEY` | Current weather on Home |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional sign-in and saved chats |

```sh
npx tsc --noEmit
npx expo lint
```

**Outlook charts** use bundled JSON. After updating NASA POWER / MAP inputs:

```sh
cd naija-health-bot
npm run build:outlook-data
```

### Backend (assistant + RAG + jobs)

Requirements: **Python 3.11+** (3.14 supported in dev), virtualenv.

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # BluesMinds, Supabase, UPDATES_JOB_SECRET, CORS
uvicorn main:app --reload --port 8000
pytest
```

**RAG setup (one-time):** run `supabase/chat_history.sql` and `supabase/rag.sql` in the Supabase SQL editor; deploy `rag-embed` and `rag-query` from `backend/supabase`; then:

```sh
.\.venv\Scripts\python.exe -m scripts.load_knowledge
```

Confirm: `GET /api/v1/health` → `"rag": true`, `"accounts": true` when keys are set.

**Daily updates job:** `POST /api/v1/jobs/daily-health-updates` with header `X-Job-Secret`. List reports: `GET /api/v1/health-reports`.

**Push alerts:** run `backend/supabase/push_tokens.sql`. In the app, Profile → Notifications → **New health updates**.

Interactive API docs: `http://localhost:8000/docs`.

---

## What is implemented vs next

**Shipped in this repo**

- Production-shaped **mobile UI** (tabs, weather strip, location flow, outlook charts, updates feed, assistant)
- **OpenWeather** live conditions + BigDataCloud state resolve
- **Bundled Outlook** MAP incidence + NASA POWER rainfall visuals
- **FastAPI** chat with model fallbacks, rate limits, optional **Supabase auth + history**
- **RAG** corpus, similarity search, load script
- **Guardrails** (scope, medicines, dosages, urgency / app-referral)
- **Daily health-updates** pipeline (scrape → summarise → store → optional Expo push)
- **Push token** register/disable API + Profile toggle
- **Keep-alive** for free-tier hosting

**Still to wire / improve**

- Package **Colab / research artefacts** (notebook, trained model) into a **prediction API**
- **Prevention** API: trained-model likelihood + category + factors + rule-based tips (all model output enters Prevention only)
- Hardening / clinical review of medical copy before wide release
- External **cron** (e.g. Make.com) if not relying on in-process Lagos scheduler
- Planner-facing validation before any operational forecast use
- Prefer **server-proxied** weather keys for production (avoid long-lived keys in the app bundle)

---

## Contributing and documentation

- Design tokens and IA: `prompts-and-guides/`
- Backend Supabase: `backend/supabase/README.md`
- Do **not** commit `.env` files or service-role keys
- LLM and scraping keys stay on the server only
- Prefer one owned Expo process in your terminal; avoid parallel agent sessions killing ports 8081–8083 while you are testing on device

---

## Licence and disclaimer

9ja Health provides **general health information and area-level context**. It is **not** medical advice, diagnosis, or treatment. For illness or emergency, contact a qualified professional; in Nigeria call **112** for emergencies.

The hackathon **ML prototype** and this repository are for **education and demonstration** until models and copy are independently reviewed. Do not use forecasts for clinical or procurement decisions without validation.

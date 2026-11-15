# 9ja Health

AI-powered health and environmental intelligence for Nigeria. Initial predictive focus: **area-level malaria incidence** (not personal risk, not a diagnosis).

## Monorepo

| Path | Role |
|---|---|
| `naija-health-bot/` | React Native + Expo mobile app |
| `prompts-and-guides/` | Product, design, technical, checklist, engineering standards |
| `backend/` | FastAPI (not scaffolded yet) |
| `ml/` | Training / model export (not scaffolded yet) |

## Core pipeline

**Location → Climate → ML → Health intelligence → Prevention → Trusted information**

Daily Nigerian health report: backend scheduler at **06:30 Africa/Lagos** → AI request → store → mobile display (**no Zapier**).

## Brand (mobile)

- Primary `#7DBA84`
- Canvas `#F5ECD4`
- Ink `#232323`
- Font: Inter

## Docs

See `prompts-and-guides/` — especially `productmanagerdoc.md`, `technicaldoc.md`, `9ja-health-design.md`, `systemprompt.md`, and `checklist.md`.

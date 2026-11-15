# 9ja Health

A mobile-first health and environmental intelligence companion for Nigeria, built
with React Native, Expo SDK 58, TypeScript and Expo Router.

## Current implementation

This repository currently contains an **interactive UI prototype**, not the
complete prediction/AI system described in the product and technical briefs.
The fictional demo profile is Ada Okafor. No account or login is required.

### Screens and navigation

The repository's locked information architecture takes precedence over the later
“Naija Health Bot” UI brief:

- **Home:** local outlook preview, honest unavailable weather state, prevention,
  official-source entry, prominent assistant card and starter questions.
- **Outlook:** area-level explanation, limitations and unavailable trend state.
- **Prevention:** six session-only checklist steps in the four required groups.
- **Assistant:** distinct bubbles, prepared source-linked examples, loading,
  unknown-topic fallback, new-conversation confirmation and emergency guidance.
- **Updates:** searchable/filterable directory of official Nigerian authorities.
  This is not a fabricated news feed.
- **Explore:** Home header book button or Profile → Explore; searchable categories,
  educational article sheets and expandable FAQs.
- **Profile & preferences:** Home header avatar; fictional profile, session chat
  history, manual state picker, 15% larger-text toggle, in-app reminder preference,
  privacy, support and about sheets. Profile is not an authentication system.

Bottom tabs remain **Home / Outlook / Prevention / Assistant / Updates**.
Explore and Profile are secondary routes, not replacement tabs.

## Visual system

User-supplied primary green `#7DBA87`, warm cream `#F5ECD4`, main text `#232323`
and secondary `#78847B`, with Inter and light mode. Supporting accessible values
and decisions are recorded in `prompts-and-guides/9ja-health-design.md` §17.

`src/constants/designTokens.ts` centralises colour, spacing, radius and type.
`src/components/healthUi.tsx` provides shared buttons, cards, text, chips, inputs,
source links, disclaimer, modal sheets and rows. Icons reuse `expo-symbols` with
SF Symbols on iOS and Material Symbols on Android/web.

Inter is bundled at `assets/fonts/Inter.ttf` via the existing `expo-font`
dependency and works without a Google Fonts request. Its SIL Open Font License
is included alongside it. No production logo or app-icon artwork is claimed;
the current native icon/splash assets are inherited Expo placeholders.

## Prototype boundaries and safety

- **No FastAPI, ML, RAG, LLM, live weather, Zapier ingestion or push service is
  connected.** Those remain future work; see the original technical brief.
- Chat uses `src/services/demoAssistant.ts`: explicit curated examples, not AI.
  Unsupported questions are acknowledged rather than answered speculatively.
- Sample replies and educational content have visible source links/content dates.
  Dates identify prototype content, not source publication or live verification.
  Medical copy needs qualified review before release.
- No fabricated predictions, risk categories, weather numbers or health reports.
- Emergency copy is always available. A small keyword check demonstrates the
  escalation UI; it is **not validated triage** and can miss emergencies.
  In Nigeria, call **112** or seek the nearest emergency department when needed.
- No diagnoses, prescriptions, medication recommendations or dosing.
- All state stays in memory: messages, checklist ticks, manual region and settings
  disappear on reload. No sensitive data should be entered.
- The notification setting only controls a visible Home reminder card. It does
  not request permissions, schedule alerts or send push notifications.
- GPS is not accessed. All 36 states and FCT are available in the manual picker.

No environment variables or API credentials are needed for the current prototype.
Do not put future LLM or database secrets in the mobile app.

## Local setup

Requirements: a Node.js version supported by Expo SDK 58 and npm.

```sh
cd naija-health-bot
npm ci
npx expo start
```

Use a compatible Expo development build for native testing. Do not generate or
hand-edit `ios/` or `android/` unless performing the documented native workflow.
Expo SDK 58 compatibility guidance is at
<https://docs.expo.dev/versions/v58.0.0/>.

### Checks

```sh
cd naija-health-bot
npx expo lint
npx tsc --noEmit
node --test tests/demoAssistant.test.cjs
```

The small Node test harness transpiles only the pure demo-response module with
the installed TypeScript compiler; it does not replace future native UI tests.

The implementation was checked with lint, TypeScript, seven content/safety/contrast
tests and successful Figma bootstrap/deploy/deploy-preview verification. Chromium
interaction checks covered all seven routes at 320, 390, 768 and 1440px, plus
130% text sizing and landscape chat. Native iOS/Android device or simulator testing
has not been performed; it is required before native distribution.

### Figma Make preview and publishing verification

Root `.figma/make/install` runs `npm ci` in the nested app.
`.figma/make/dev` runs Expo web on the supplied port with watch mode enabled.
Do not start a second server in the hosted workspace.

```sh
figma make verify-bootstrap
figma make verify-deploy
figma make verify-deploy-preview
```

Both deploy scripts export static Expo web output to `naija-health-bot/dist`
before handing it to the Figma static adapter. Native distribution is separate
and requires Expo/EAS build/signing configuration.

## Structure

```text
naija-health-bot/
  assets/fonts/           Bundled Inter and licence
  src/app/                Expo Router screens and root layout
  src/components/         Shared native UI, shell, location/outlook/weather views
  src/constants/          Design tokens and curated educational content
  src/hooks/              Session-only prototype state
  src/services/           Explicit demo response selection, not an AI integration
  tests/                  Safety/boundary regression tests for the prototype
prompts-and-guides/        Product, engineering, architecture and design authority
.figma/make/               Hosted lifecycle and deployment configuration
```

Original repository instructions remain in `naija-health-bot/AGENTS.md` and
`prompts-and-guides/*.md`. Future backend work should follow the documented
React Native → FastAPI → validated services architecture, keep keys server-side,
and integrate real sources before presenting live results.

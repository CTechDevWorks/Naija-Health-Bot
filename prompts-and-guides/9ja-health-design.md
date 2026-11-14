---
version: alpha
name: 9ja-Health-design
description: >
  Design system for 9ja Health — an AI-powered health and environmental
  intelligence mobile app for Nigeria, with malaria as the initial predictive
  focus (the brand itself is NOT malaria-specific). Adapted from the structure
  of TPM-The-Peoples-Market-design, reworked from a desktop/mobile-web
  e-commerce marketplace into a mobile-first React Native / Expo app.
  Shape (all-rounded), chart style, motion personality, haptics/sound,
  prevention groups, and assistant starter questions are locked.
  Fields that still require a special brand/design touch — colours,
  typography, logo, iconography, imagery, elevation tint/scrim colour,
  and signature chrome — remain BLANK (TODO / BLANK). Agents must not
  invent values for blank fields. See §15 for the blank register.

# =============================================================================
# BRAND TOKENS — PARTIALLY LOCKED
# Structure, token names, usage, and behaviour below are locked.
# Visual values marked BLANK are NOT locked — do not invent alternatives.
# Fill blank values only when the product owner / brand designer supplies them.
# =============================================================================

colors:
  # --- Brand ---
  # BLANK: The entire palette requires a special brand touch.
  # No hex values, no palette names, and no brand-colour mix/ratio
  # (TPM's locked 60/40 brown/green has NO equivalent here yet) are defined.
  brand-mix: null                        # BLANK — TODO: brand colour mix/ratio, if any
  primary: null                          # BLANK — TODO: hex — lead brand colour; primary CTAs, key actions
  primary-active: null                   # BLANK — TODO: hex — pressed primary
  primary-disabled: null                 # BLANK — TODO: hex — disabled primary
  secondary: null                        # BLANK — TODO: hex — supporting brand colour; trust/secondary moments
  secondary-active: null                 # BLANK — TODO: hex — pressed secondary
  accent: null                           # BLANK — TODO: hex (optional) — environmental / data accents
  on-primary: null                       # BLANK — TODO: hex — text/icons on primary fills
  on-secondary: null                     # BLANK — TODO: hex — text/icons on secondary fills

  # --- Surfaces ---
  # BLANK: Light / dark / system colour-mode is also undecided (TPM was
  # light-only; that lock does NOT carry over automatically).
  color-mode: null                       # BLANK — TODO: light-only | dark-only | light+dark | system
  canvas: null                           # BLANK — TODO: hex — default screen background
  canvas-soft: null                      # BLANK — TODO: hex — soft bands, grouped sections, data stages
  surface-card: null                     # BLANK — TODO: hex — cards / elevated panels / sheets
  surface-strong: null                   # BLANK — TODO: hex — icon buttons, chip fills, input fills

  # --- Text ---
  ink: null                              # BLANK — TODO: hex — headlines / primary text
  body: null                             # BLANK — TODO: hex — secondary running text
  muted: null                            # BLANK — TODO: hex — captions, metadata, source rows, timestamps
  muted-soft: null                       # BLANK — TODO: hex — disabled / lowest emphasis
  on-dark: null                          # BLANK — TODO: hex — text on dark scrims / dark fills (if used)

  # --- Chrome ---
  hairline: null                         # BLANK — TODO: hex — default 1px borders / dividers
  hairline-soft: null                    # BLANK — TODO: hex — lighter divider
  border-strong: null                    # BLANK — TODO: hex — stronger / focused outline
  scrim: null                            # BLANK — TODO: colour + opacity — modal / sheet backdrop

  # --- Health semantics ---
  # BLANK: Every semantic value is undecided. In particular, the colour
  # mapping for risk categories (Low / Moderate / Elevated / High) must be
  # chosen deliberately and tested — never assume green→red or any ramp.
  success: null                          # BLANK — TODO: hex — confirmation, completed prevention action
  error: null                            # BLANK — TODO: hex — form errors, failures, destructive actions
  warning: null                          # BLANK — TODO: hex — caution, stale data, degraded service
  info: null                             # BLANK — TODO: hex — informational tips, source notes
  risk-low: null                         # BLANK — TODO: hex — "Low" area-level risk category
  risk-moderate: null                    # BLANK — TODO: hex — "Moderate" area-level risk category
  risk-elevated: null                    # BLANK — TODO: hex — "Elevated" area-level risk category
  risk-high: null                        # BLANK — TODO: hex — "High" area-level risk category
  chart-series: null                     # BLANK — TODO: palette for trends, factors, forecasts

typography:
  # BLANK: All typographic choices require a special brand touch.
  # The token NAMES and ROLES below are locked; every family, import,
  # size, weight, line-height, and letter-spacing value is blank.
  # Legibility requirements that any filled choice must meet are in §3.
  font-display: null                     # BLANK — TODO: family stack for headlines / display
  font-body: null                        # BLANK — TODO: family stack for body / UI / buttons
  font-mono: null                        # BLANK — TODO: family stack for data/code (rare)
  font-import: null                      # BLANK — TODO: font loading URL / Expo font assets
  font-optical-sizing: null              # BLANK — TODO: if the chosen display font supports it

  # Token roles (values BLANK — TODO: fontFamily, fontSize, fontWeight,
  # lineHeight, letterSpacing for every token below):
  display-xl: null                       # BLANK — TODO — onboarding / major outlook moment (rare)
  display-lg: null                       # BLANK — TODO — screen-level hero statement
  display-md: null                       # BLANK — TODO — screen titles
  heading-xl: null                       # BLANK — TODO — card / section heads (large)
  heading-lg: null                       # BLANK — TODO — sub-section titles
  heading-md: null                       # BLANK — TODO — compact titles, list item heads
  body-lg: null                          # BLANK — TODO — lead explanations, outlook summary
  body-md: null                          # BLANK — TODO — default UI body
  body-strong: null                      # BLANK — TODO — emphasis, risk label, key values
  body-sm: null                          # BLANK — TODO — card meta, secondary detail
  caption: null                          # BLANK — TODO — source rows, timestamps, footnotes
  micro: null                            # BLANK — TODO — legal, disclaimers (must stay readable)
  badge: null                            # BLANK — TODO — risk category / topic / urgency badges
  button-md: null                        # BLANK — TODO — primary/secondary buttons
  button-sm: null                        # BLANK — TODO — compact buttons, chips
  tab-label: null                        # BLANK — TODO — bottom tab bar labels
  data-value: null                       # BLANK — TODO — weather/prediction values (use tabular figures)
  data-label: null                       # BLANK — TODO — labels paired with data values

rounded:
  # LOCKED — all-rounded personality (soft companion, not clinical/sharp).
  # Every interactive and card surface uses a rounded corner. Prefer the
  # highest suitable token over inventing a sharper one.
  none: 0px                              # Full-bleed dividers / media edges only — avoid elsewhere
  xs: 8px                                # Tiny chrome, chart markers, nested chips
  sm: 12px                               # Inputs, small controls
  md: 16px                               # Standard cards (weather, prevention, report)
  lg: 24px                               # Outlook hero, sheets, chat bubbles, large panels
  xl: 32px                               # Modals, onboarding panels, bottom sheets top corners
  pill: 9999px                           # Chips, badges, search, citation chips, circular icons
  button: 9999px                         # All CTAs are fully rounded (pill) — matches all-rounded system

spacing:
  # Functional layout rhythm — carried over from TPM's 8px base and locked.
  # This is usability structure, not brand expression.
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 32px                          # Default vertical rhythm between phone screen sections
  section-lg: 48px                       # Larger breaks (onboarding, empty states)
  huge: 64px

layout:
  # Mobile-app layout (React Native / Expo). No desktop content-max,
  # no PLP columns, no nav-height-desktop — those were marketplace-web.
  gutter-phone: 16px                     # Default screen edge padding
  gutter-tablet: 24px
  content-max-phone: null                # Optional cap on very large phones; set in code if needed
  reading-max: 560px                     # Max line length for explanations (tablet / large phones)
  bottom-tab-height: 64px                # Excluding safe-area inset
  header-height-phone: 56px
  sticky-action-height: 64px             # Sticky bottom action bars, excluding safe-area inset
  touch-min: 44px
  touch-preferred: 48px
  logo-nav-height: null                  # BLANK — TODO: depends on final logo (§5)
  logo-clear-space: null                 # BLANK — TODO: depends on final logo (§5)
  app-icon-size: null                    # BLANK — TODO: per platform / store requirements at build time

breakpoints:
  # Phones are the product. Tablet is a supported stretch, not a second design.
  phone-portrait-max: 639px
  phone-landscape: allowed-not-optimised # Health info is never blocked behind a rotate notice (see §11.4)
  tablet-portrait-min: 640px
  tablet-portrait-max: 1023px
  tablet-landscape-min: 768px
  large-screen-min: 1024px               # Tablet landscape / foldables — reuse phone patterns, capped width

product:
  brand-name: "9ja Health"               # Locked — NOT malaria-specific (PM §5)
  category: "AI-powered health and environmental intelligence"
  initial-market: "Nigeria"
  initial-predictive-focus: "Malaria — area-level annual incidence (Malaria Atlas Project target)"
  platform: "React Native + Expo + TypeScript (mobile app — not a website)"
  color-mode: null                       # BLANK — TODO: see colors.color-mode
  signature-chrome: null                 # BLANK — TODO: none, or a future brand motif (§5, §15)
  currency: null                         # Not applicable — no commerce
  account-required: false                # Locked — no unnecessary auth for the MVP (PM §27)
  continuous-tracking: false             # Locked — foreground location only, no background tracking
  diagnostic-tool: false                 # Locked — never presents as diagnosis (PM §1, §32)

components:
  # Structure, sizing, shape, and behaviour are locked. Colour and
  # typography references still resolve to BLANK tokens above and must
  # not be rendered with invented values. Radius uses locked rounded.*.

  button-primary:
    backgroundColor: "{colors.primary}"          # BLANK value — see colors
    textColor: "{colors.on-primary}"             # BLANK value — see colors
    typography: "{typography.button-md}"         # BLANK value — see typography
    rounded: "{rounded.button}"                  # locked 9999px pill
    padding: 14px 24px
    height: 48px
    minWidth: 44px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"   # BLANK value
    textColor: "{colors.on-primary}"             # BLANK value
    rounded: "{rounded.button}"                  # locked pill
    height: 48px
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}" # BLANK value
    textColor: "{colors.on-primary}"             # BLANK value
    rounded: "{rounded.button}"                  # locked pill
    height: 48px
  button-secondary:
    backgroundColor: "{colors.canvas}"           # BLANK value
    textColor: "{colors.secondary}"              # BLANK value
    typography: "{typography.button-md}"         # BLANK value
    rounded: "{rounded.button}"                  # locked pill
    padding: 13px 23px
    height: 48px
    border: "1px solid {colors.secondary}"       # BLANK colour
  button-secondary-filled:
    backgroundColor: "{colors.secondary}"        # BLANK value
    textColor: "{colors.on-secondary}"           # BLANK value
    typography: "{typography.button-md}"         # BLANK value
    rounded: "{rounded.button}"                  # locked pill
    padding: 14px 24px
    height: 48px
  button-tertiary:
    backgroundColor: transparent
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.button-md}"         # BLANK value
    padding: 8px 0
  button-icon-circular:
    backgroundColor: "{colors.surface-strong}"   # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    rounded: "{rounded.pill}"                    # locked
    size: 40px
    hitTarget: 48px

  search-bar:                                    # Health-report search / assistant topic search
    backgroundColor: "{colors.canvas-soft}"      # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.body-md}"           # BLANK value
    rounded: "{rounded.pill}"                    # locked
    padding: 10px 16px
    height: 44px
  text-input:                                    # Manual state search, assistant composer, forms
    backgroundColor: "{colors.surface-card}"     # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.body-md}"           # BLANK value
    rounded: "{rounded.sm}"                      # locked 12px
    padding: 14px 12px
    height: 48px
    border: "1px solid {colors.hairline}"        # BLANK colour
  text-input-focused:
    backgroundColor: "{colors.surface-card}"     # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    border: "2px solid {colors.border-strong}"   # BLANK colour — final focus colour is a brand/a11y call
    height: 48px
  text-input-error:
    backgroundColor: "{colors.surface-card}"     # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    border: "2px solid {colors.error}"           # BLANK colour
    helperColor: "{colors.error}"                # BLANK colour

  # --- 9ja Health signature visual components ---
  location-header:                               # Current state/region + location status (§9.3)
    backgroundColor: "{colors.canvas}"           # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.heading-md}"        # BLANK value
    statusTypography: "{typography.caption}"     # BLANK value
  outlook-card:                                  # THE hero card — area-level malaria outlook (§9.4)
    backgroundColor: "{colors.surface-card}"     # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    rounded: "{rounded.lg}"                      # locked 24px
    padding: 16px
    # Must contain: risk-category badge + plain-language headline +
    # prediction period + "area-level, not personal" line + source row
  risk-badge:
    typography: "{typography.badge}"             # BLANK value
    rounded: "{rounded.pill}"                    # locked
    padding: 4px 10px
    # Variant colours BLANK: risk-low / risk-moderate / risk-elevated / risk-high
    # Text label is mandatory — colour is never the only signal (§13)
  weather-strip:                                 # Temperature / humidity / rainfall / wind (§9.5)
    backgroundColor: "{colors.canvas-soft}"      # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    valueTypography: "{typography.data-value}"   # BLANK value (tabular figures)
    labelTypography: "{typography.data-label}"   # BLANK value
    rounded: "{rounded.md}"                      # locked 16px
    padding: 12px
  prevention-checklist-item:                     # Evidence-based, rules-engine actions (§9.6)
    backgroundColor: "{colors.surface-card}"     # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.body-md}"           # BLANK value
    rounded: "{rounded.md}"                      # locked 16px
    padding: 12px
    minHeight: 48px
  report-card:                                   # Nigerian health report (NCDC / FMOH / NMEP…) (§9.7)
    backgroundColor: "{colors.surface-card}"     # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    titleTypography: "{typography.body-strong}"  # BLANK value
    metaTypography: "{typography.caption}"       # BLANK value — source + date always visible
    rounded: "{rounded.md}"                      # locked 16px
    padding: 16px
  source-row:                                    # Source + timestamp; reused everywhere
    textColor: "{colors.muted}"                  # BLANK value
    typography: "{typography.caption}"           # BLANK value
  citation-chip:                                 # Assistant + report source citations (§9.8)
    backgroundColor: "{colors.surface-strong}"   # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.caption}"           # BLANK value
    rounded: "{rounded.pill}"                    # locked
    padding: 4px 10px
    height: 32px                                 # 44px hit target via padding/hitSlop
  disclaimer-banner:                             # "Information, not diagnosis" (§9.9)
    backgroundColor: "{colors.canvas-soft}"      # BLANK value
    textColor: "{colors.body}"                   # BLANK value
    typography: "{typography.body-sm}"           # BLANK value
    rounded: "{rounded.md}"                      # locked 16px
    padding: 12px
  chat-bubble-user:
    backgroundColor: "{colors.primary}"          # BLANK value
    textColor: "{colors.on-primary}"             # BLANK value
    typography: "{typography.body-md}"           # BLANK value
    rounded: "{rounded.lg}"                      # locked 24px
    padding: 12px
  chat-bubble-assistant:
    backgroundColor: "{colors.surface-card}"     # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.body-md}"           # BLANK value
    rounded: "{rounded.lg}"                      # locked 24px
    padding: 12px
  filter-chip:                                   # Report topics, prevention topics, time ranges
    backgroundColor: "{colors.canvas}"           # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.button-sm}"         # BLANK value
    rounded: "{rounded.pill}"                    # locked
    padding: 8px 16px
    height: 40px
    border: "1px solid {colors.hairline}"        # BLANK colour
  filter-chip-active:
    backgroundColor: "{colors.secondary}"        # BLANK value
    textColor: "{colors.on-secondary}"           # BLANK value
    typography: "{typography.button-sm}"         # BLANK value
    rounded: "{rounded.pill}"                    # locked
    padding: 8px 16px
    height: 40px
  bottom-tab-bar:
    backgroundColor: "{colors.canvas}"           # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    activeTextColor: null                        # BLANK — TODO: token (likely primary/secondary)
    labelTypography: "{typography.tab-label}"    # BLANK value
    height: "{layout.bottom-tab-height}"
    borderTop: "1px solid {colors.hairline}"     # BLANK colour
  top-header:
    backgroundColor: "{colors.canvas}"           # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    typography: "{typography.heading-md}"        # BLANK value
    height: "{layout.header-height-phone}"
  sticky-action-bar:
    backgroundColor: "{colors.canvas}"           # BLANK value
    textColor: "{colors.ink}"                    # BLANK value
    height: "{layout.sticky-action-height}"
    borderTop: "1px solid {colors.hairline}"     # BLANK colour
  trend-chart:
    seriesColors: "{colors.chart-series}"        # BLANK value — palette still open (§15A)
    # Visual style LOCKED (§9.4 / §15E.31):
    type: soft-area-line                         # Single primary series: rounded line + soft fill under the curve
    secondarySeries: dashed-line-optional        # Climate context (e.g. rainfall) as dashed overlay only — never stacked bars
    grid: horizontal-only                        # Light {colors.hairline-soft} horizontals; no vertical grid clutter
    fill: soft-under-curve                       # Low-opacity fill from line to baseline (opacity TBD with palette)
    lineCap: round
    lineJoin: round
    markers: none-by-default                     # Optional small round dots on tap/focus only
    xAxis: year-or-period-labels                 # Everyday words ("2020", "2021") — not dense tick spam
    yAxis: plain-language-unit                   # e.g. "Estimated cases per 1,000 people" — never raw jargon alone
    heightPhone: 180px
    heightTablet: 220px
    textSummaryRequired: true                    # Always a one-sentence summary above or below the chart
    emptyState: "Trend data isn't available for this area yet."
    reduceMotion: instant-final-frame            # No draw animation when reduce-motion is on
  permission-prompt:                             # Foreground location explanation
    message: "Allow location so 9ja Health can show the health outlook for your area. You can choose your state manually instead."
  location-denied-state:
    message: "Location is off. Choose your state to see your area's health outlook."
  safety-escalation-card:                        # Assistant: "seek care" responsible escalation
    message: "This app gives health information, not a diagnosis. If symptoms are severe or worrying, please seek care from a health professional promptly."

  # --- Content labels (locked by design intuition; medical copy review can refine wording) ---
  prevention-groups:                             # §9.5 — ordered list of section headers
    - "Around the home"
    - "When sleeping"
    - "Out and about"
    - "If someone feels unwell"
  assistant-starter-questions:                   # §9.6 — chips; keep ≤6 visible
    - "How does malaria spread?"
    - "What can I do to prevent mosquito bites?"
    - "What are common malaria symptoms?"
    - "When should someone get tested?"
    - "What does area-level risk mean?"
    - "Why does rain matter for malaria here?"

brand-assets:
  # BLANK: Logo / icon / imagery still require a special brand touch.
  logo-full: null                      # BLANK — TODO: file(s), anatomy, wordmark lockup
  logo-mark-only: null                 # BLANK — TODO: file(s) — compact header, splash, empty states
  app-icon: null                       # BLANK — TODO: iOS / Android app icon artwork
  splash-screen: null                  # BLANK — TODO: splash artwork, background, timing
  favicon-pwa: null                    # BLANK — TODO: only if a web surface is ever added
  iconography: null                    # BLANK — TODO: icon library / custom set, stroke vs filled, weight
  illustration-style: null             # BLANK — TODO: illustration/photo approach (onboarding, empty states)
  photography-imagery: null            # BLANK — TODO: art direction — Nigerian contexts, people, environment
  brand-motif: null                    # BLANK — TODO: signature chrome/motif, if any (map, weather, mosquito — or none)
  # Motion personality LOCKED (§12 / §15E.32) — calm companion, not playful bounce:
  motion-personality: quiet-settle
  motion-easing: ease-out              # Soft decelerate into rest; no spring / bounce
  motion-duration-short: 150ms
  motion-duration-default: 220ms
  motion-duration-chart: 500ms
  skeleton-style: soft-pulse           # Opacity pulse 0.45→1.0 over ~1.2s on rounded skeleton blocks
  chart-draw: left-to-right-once       # Soft path draw once on first paint; then static
  haptics-policy: selective-light      # §12 / §15E.33 — see prose
  sound-policy: silent                 # No UI sounds in MVP
---

# 9ja Health — Design Instructions

**Audience:** AI agents and developers building 9ja Health (React Native / Expo mobile app).

**Rule:** This file is the design authority for structure, behaviour, content, and feel. Token *structure* is locked. Shape, chart geometry, motion, haptics, prevention groups, and starter questions are filled. Token *values* marked **BLANK** (mainly colour, type, logo/imagery) do not exist yet — do not invent them. Build with named tokens (`{colors.primary}`, `{typography.body-md}`, `{rounded.md}`) so blank values can drop in later without a refactor.

**Source of truth for product intent:** `productmanagerdoc.md` (9JA HEALTH — Master Product Manager Brief). If this file and the PM brief disagree on product/safety meaning, the PM brief wins and this file must be updated.

**What changed from TPM:** TPM was a cream-canvas web marketplace (brown/green, Fraunces/Xmind, product cards, cart, checkout, PLP/PDP, 60/40 brand mix, landscape block, light-only). None of those brand values, commerce patterns, or web layouts carry over. What carries over is TPM's *method*: named tokens, one primary action per band, defined component states, clear do's/don'ts, responsive rules, motion timings, and accessibility requirements — reworked below for a health app.

**Assets folder:** `BLANK — TODO:` create/name the design-assets folder when logo/icon/imagery files exist (§5).

---

## 0. Agent rules (read first)

1. **Never invent a BLANK value.** No hex, font, logo, icon style, illustration style, or brand motif unless it is written in this file. Radius, chart style, motion personality, haptics, prevention groups, and starter questions are already locked — use them. Leave remaining BLANK tokens referenced and flag the gap.
2. Document **default** and **pressed/active/disabled/focused/loading/empty/error** states — no hover-as-brand-law (this is a touch app).
3. Reference tokens by name (`{colors.primary}`, `{spacing.lg}`, `{rounded.md}`).
4. One filled primary CTA per visible screen region (`{components.button-primary}`). Pair at most with `{components.button-secondary}`.
5. **Brand is 9ja Health, not malaria.** Never name, icon, or theme the whole product around malaria/mosquitoes unless §5/§15 is filled saying so (PM §5). Malaria is the first lens, not the identity.
6. **Never present area-level prediction as personal risk.** Forbidden pattern: “You have a 75% chance of getting malaria today.” Required pattern: “The model estimates elevated malaria incidence in your area.” (PM §14)
7. Every prediction, weather reading, report, and assistant answer shows **source + timestamp/date** via `{components.source-row}` or `{components.citation-chip}` (PM §38). No orphan numbers.
8. Touch targets ≥ `{layout.touch-min}` (44px). Primary actions use `{layout.touch-preferred}` (48px).
9. **Light/dark mode is undecided (BLANK).** Do not build a dark theme — or lock light-only — until `colors.color-mode` is filled.
10. **No account wall for the MVP.** Browsing the dashboard, outlook, prevention, reports, and assistant must not require sign-up (PM §27).
11. Voice/tone for all UI copy: **calm, clear, plain-language, trustworthy, non-alarmist** (§4). Short sentences. No hype, no fear, no clinical coldness.
12. The app is **not a diagnostic tool** (PM §1, §32). The disclaimer pattern (§9.9) is a first-class component, not footer trivia.

---

## 1. Overview — what it is and how it should feel

9ja Health is a **daily health companion** that turns a user's environment and trusted public-health data into understandable, actionable health intelligence (PM §3, §43):

> **Location → Climate → ML → Health Intelligence → Prevention → Trusted Information**

The user opens the app, the app knows (with permission) which Nigerian state/region they are in, and within seconds they can answer: *“What does my environment and the latest public-health information mean for my health today, and what should I be aware of?”* (PM §2)

### 1.1 The feeling (locked — this is the aesthetic brief)

| The app should feel like… | Not like… |
|---|---|
| Checking the weather — quick, daily, glanceable | Visiting a hospital — clinical, intimidating, sterile |
| A trusted companion who explains calmly | An alarm bell — scary headlines, red-alert panic |
| A clear public noticeboard from sources you can name | A mysterious AI that hands down a score |
| Something built for *your* state, *your* rain, *your* area | A generic global health website |
| Honest about what it knows and doesn't know | Confident about things the data can't support |

**Keywords (locked):** calm · clear · trustworthy · plain-language · non-alarmist · explainable · grounded in place · lightweight · daily · preventive.

**Aesthetic character (structure, not colour/font):**
- **Uncluttered and scannable in seconds.** The home dashboard answers first, explains second, details third. One idea per card; generous white/blank space via the 8px spacing rhythm; nothing decorative competing with a health message.
- **Card-led, not chart-led.** Rounded-card grouping (radius values BLANK) organises location, outlook, environment, prevention, and updates into digestible blocks a student, parent, trader, or rural user can parse at a glance (PM §6, §22).
- **Data that reads like weather, not like a lab result.** Big, legible values (typography BLANK) with small human labels — “Warm and humid, rain likely later” before “31°C · 82% · 12 mm” (PM §9).
- **Trust is visual, not just verbal.** Sources, dates, and “what this does not mean” lines sit directly under the claims they support — small, consistent, always in the same place. Trust comes from transparency and consistency, never from looking “medical” or official-by-imitation.
- **Nigerian and local by content, not by costume.** Localness shows in state/region naming, Nigerian authorities (NCDC, Federal Ministry of Health and Social Welfare, NPHCDA, National Malaria Elimination Programme), local weather, and locally relevant prevention — not in invented national-colour theming (palette is BLANK).
- **Lightweight in every sense.** Fast on low-end Android phones, tolerant of slow networks, forgiving when GPS/weather/model services fail (§11, PM §31). A dashboard that loads its cached last outlook beats a blank spinner.
- **Reassuring momentum.** Prevention is framed as small doable actions (“this week, you can…”), never as a list of dangers. Even an Elevated/High outlook screen should leave the user feeling *equipped*, not frightened.

### 1.2 Core screens (locked IA)

Bottom-tab navigation (5 tabs max, labels §9.10):

1. **Home** — dashboard (§9.2 / PM §22)
2. **Outlook** — risk/outlook detail & explanation (§9.4 / PM §23)
3. **Prevention** — practical actions (§9.5 / PM §24)
4. **Assistant** — AI health information chat (§9.6 / PM §17–19, §25)
5. **Updates** — Nigerian daily health reports (§9.7 / PM §20–21, §26)

Plus: **Settings** (from the header, not a 6th tab — §9.8 / PM §27), **location-permission & manual-state flows** (§9.1), and onboarding only if it earns its place (§9.1).

### 1.3 Product philosophy in one line

> **ML predicts → Weather informs → Rules recommend → RAG explains → Zapier keeps information fresh.** (PM §30)

Each layer gets its own visual treatment so users can tell *prediction* from *weather* from *advice* from *official report* — never blended into one undifferentiated “AI says” block.

**Locked characteristics:**
- 8px spacing base; card-led phone layout (§6)
- All-rounded shape: pill CTAs/chips; cards 16–24px; sheets/modals 24–32px (§8)
- Soft area-line charts, quiet-settle motion, selective-light haptics / silent sound (§9.13, §12)
- Portrait-first phone design; health information is never hidden behind a rotate notice (§11.4)
- Foreground location only; manual state fallback always available (PM §8)
- No commerce, no cart, no checkout, no accounts-for-MVP, no diagnosis
- Colour, type, logo, and imagery still BLANK pending §15

---

## 2. Colors

> ⚠️ **THIS ENTIRE SECTION IS BLANK BY DESIGN.** No palette exists yet. The tables below define token *names, roles, and rules only*. Every value is `TODO` for the product owner / brand designer.

### Brand mix
| Item | Status |
|---|---|
| Brand colour mix / ratio (TPM had a locked 60/40) | **BLANK — TODO** — decide if a mix rule is even needed for a health app |
| Lead brand colour (`{colors.primary}`) | **BLANK — TODO: hex** |
| Supporting brand colour (`{colors.secondary}`) | **BLANK — TODO: hex** |
| Optional accent (`{colors.accent}`) | **BLANK — TODO: hex or “none”** |

### Brand tokens (values BLANK)
| Token | Use (locked) |
|---|---|
| `{colors.primary}` | Primary CTA fill, key actions, selected states |
| `{colors.primary-active}` | Pressed primary |
| `{colors.primary-disabled}` | Disabled primary |
| `{colors.secondary}` | Secondary actions, trust moments, active filter chips |
| `{colors.secondary-active}` | Pressed secondary |
| `{colors.accent}` | Environmental/data accents — only if a third brand colour is chosen |
| `{colors.on-primary}` / `{colors.on-secondary}` | Text/icons on brand fills |

### Surfaces (values BLANK)
| Token | Use (locked) |
|---|---|
| `colors.color-mode` | **BLANK — TODO:** light-only / dark-only / both / system |
| `{colors.canvas}` | Screen background |
| `{colors.canvas-soft}` | Soft bands, weather strip, disclaimer, grouped sections |
| `{colors.surface-card}` | Cards, inputs, sheets, assistant bubbles |
| `{colors.surface-strong}` | Icon-button fills, citation chips |

### Text (values BLANK)
| Token | Use (locked) |
|---|---|
| `{colors.ink}` | Headlines, primary text |
| `{colors.body}` | Long-form explanations |
| `{colors.muted}` | Captions, source rows, timestamps, inactive tabs |
| `{colors.muted-soft}` | Disabled text |
| `{colors.on-dark}` | Text on dark scrims/fills, if any |

### Chrome & health semantics (values BLANK)
| Token | Use (locked) |
|---|---|
| `{colors.hairline}` / `{colors.hairline-soft}` / `{colors.border-strong}` | Borders, dividers, focus outline |
| `{colors.scrim}` | Modal/sheet backdrop (colour + opacity both TODO) |
| `{colors.success}` | Confirmation, completed actions |
| `{colors.error}` | Errors, failures, destructive actions |
| `{colors.warning}` | Caution, stale data, degraded/offline states |
| `{colors.info}` | Informational tips, source notes |
| `{colors.risk-low}` | “Low” category — mapping TODO, see rules |
| `{colors.risk-moderate}` | “Moderate” category — mapping TODO |
| `{colors.risk-elevated}` | “Elevated” category — mapping TODO |
| `{colors.risk-high}` | “High” category — mapping TODO |
| `{colors.chart-series}` | Trend/factor/forecast chart palette — TODO |

### Rules (locked, whoever fills the values must honour them)
- **Risk colour is an open design problem, not a default traffic light.** Whoever fills `risk-*` must consider: colour-vision deficiency, sunlight readability, cultural reading, and the non-alarmist mandate. A red-screaming “High” that panics users fails the brief even if it is conventional.
- **Colour is never the only signal.** Every risk category always pairs colour with a text label + plain-language sentence (§13).
- **Never use risk/semantic colours as decoration** or as large background floods on a whole screen. Semantics stay local to the badge/value they describe.
- One filled primary CTA per screen region (§0.4). Do not introduce colours outside this table once filled.
- All filled combinations must pass WCAG AA contrast checks in §13 *in bright outdoor light* (a realistic Nigerian use context), not just in an office.
- Do not theme the brand around malaria (e.g., “mosquito red”), Nigerian flag colours, or clinical/hospital colour clichés *by assumption* — if the brand designer chooses any of those deliberately, record the reasoning when filling this section.
- Logo colours, once designed (§5), must stay intact — never recolor brand artwork to force a UI palette.

---

## 3. Typography

> ⚠️ **THIS ENTIRE SECTION IS BLANK BY DESIGN.** No families, sizes, or weights exist yet. Token names/roles and the legibility rules below are locked; every value is `TODO`.

### Font loading
```
BLANK — TODO: @font-face / Expo Font assets / system-font decision + loading URL
(TPM's Google Fonts import does NOT carry over — React Native does not use CSS @import.)
```

### Families (BLANK)
| Role | Status |
|---|---|
| Display / headlines (`{typography.font-display}`) | **BLANK — TODO: family + fallbacks** |
| Body / UI / buttons / data (`{typography.font-body}`) | **BLANK — TODO: family + fallbacks** |
| Mono / data-code (`{typography.font-mono}`) | **BLANK — TODO: family + fallbacks, or “system mono”** |

### Hierarchy — roles locked, values BLANK
| Token | Use (locked) | Size / Weight / Line-height / Spacing |
|---|---|---|
| `{typography.display-xl}` | Onboarding / rare major moments | **BLANK — TODO** |
| `{typography.display-lg}` | Screen-level hero statement | **BLANK — TODO** |
| `{typography.display-md}` | Screen titles | **BLANK — TODO** |
| `{typography.heading-xl}` | Large card/section heads | **BLANK — TODO** |
| `{typography.heading-lg}` | Sub-section titles | **BLANK — TODO** |
| `{typography.heading-md}` | Compact titles, list heads, location header | **BLANK — TODO** |
| `{typography.body-lg}` | Lead explanations, outlook summary sentence | **BLANK — TODO** |
| `{typography.body-md}` | Default UI body | **BLANK — TODO** |
| `{typography.body-strong}` | Emphasis, risk labels, key values, report titles | **BLANK — TODO** |
| `{typography.body-sm}` | Card meta, disclaimers, secondary detail | **BLANK — TODO** |
| `{typography.caption}` | Source rows, timestamps, citations | **BLANK — TODO** |
| `{typography.micro}` | Legal text only | **BLANK — TODO** |
| `{typography.badge}` | Risk / topic / urgency badges | **BLANK — TODO** |
| `{typography.button-md}` | Buttons | **BLANK — TODO** |
| `{typography.button-sm}` | Compact buttons, chips | **BLANK — TODO** |
| `{typography.tab-label}` | Bottom tab labels | **BLANK — TODO** |
| `{typography.data-value}` | Weather & prediction values | **BLANK — TODO** (tabular figures required) |
| `{typography.data-label}` | Labels under/beside data values | **BLANK — TODO** |

### Legibility rules any filled choice must meet (locked)
- Readable by everyday users across ages and literacy levels (PM §6): favour larger default body size, generous line-height, and sentence case over dense or all-caps text blocks. Exact values TODO with the scale.
- **Disclaimers and source text must never be shrunk into illegibility** to make them less prominent. `{typography.micro}` still has a readable floor — value TODO, principle locked.
- Numbers (temperature, rainfall, dates, incidence values) use tabular figures (`font-feature-settings: "tnum"` equivalent) so weather strips and trends don't jitter.
- The chosen fonts must render correctly offline in Expo (bundled assets or system fonts) and cover characters in Nigerian names/places; diacritic/character coverage is a selection criterion — TODO to verify when families are chosen.
- Future multilingual support is P2 (PM §35): do not pick a display font that would block adding Nigerian languages later without recording that limitation.
- Do not invent sizes outside the filled ladder once it exists; until it exists, developers use token names with platform-default fallbacks and flag the gap.

---

## 4. Voice & tone

**Voice (locked from PM):** calm, clear, plain-language, trustworthy, non-alarmist. A knowledgeable companion explaining things simply — never a doctor giving orders, never a headline trying to scare, never an AI showing off.

| Do | Don't |
|---|---|
| “The model estimates elevated malaria incidence in your area.” | “You have a 75% chance of getting malaria today.” |
| “Warm and humid today, with rain likely later.” | “Dangerous conditions detected!!!” |
| “Here are three things that help this week…” | Long academic/medical paragraphs on the dashboard |
| “Source: Malaria Atlas Project · Updated 12 Nov 2026” | Unsourced claims, “experts say”, invented authorities |
| “This is area-level information, not a personal diagnosis.” | Language implying diagnosis, prescription, or dosage |
| “We couldn't load fresh weather. Showing your last outlook from…” | Silent fake/fallback data presented as fresh |
| Short sentences; everyday words first, medical term second with explanation | Jargon-first copy (“ Plasmodium falciparum incidence…” with no plain version) |
| Seek-care escalation when symptoms sound serious (§9.6) | Diagnosing, reassuring away, or min/maxing serious symptoms |

**Locked copy intents (adapt exact wording in-app, keep the meaning):**
- Location ask: `{components.permission-prompt}` — explain *why* before the OS prompt.
- Location denied: `{components.location-denied-state}` — no guilt, manual state is a full equal path.
- Disclaimer intent: **9ja Health gives health information, not a diagnosis. It does not replace a health professional.**
- Escalation intent: `{components.safety-escalation-card}` (PM §19).
- AI-summary label intent: **AI summary** — always distinguished from the original source reporting (PM §21, §26).

---

## 5. Logo, brand mark & visual identity

> ⚠️ **THIS ENTIRE SECTION IS BLANK BY DESIGN.** TPM's logo anatomy, files, colours, and usage sizes do not carry over.

| Item | Status |
|---|---|
| Logo files (full lockup) | **BLANK — TODO: files, folder, formats (SVG/PNG), transparent variants** |
| Mark-only logo (compact header / splash / empty states) | **BLANK — TODO: files** |
| App icon (iOS/Android, store listing) | **BLANK — TODO: artwork + platform sizes at build time** |
| Splash screen | **BLANK — TODO: artwork, background (colour token), duration/behaviour** |
| Wordmark anatomy (type, case, spacing of “9ja Health”) | **BLANK — TODO — depends on §3 fonts** |
| Logo colours | **BLANK — TODO — never recoloured by agents once set** |
| Clear space / minimum size / header height (`{layout.logo-nav-height}`, `{layout.logo-clear-space}`) | **BLANK — TODO — set when artwork exists** |
| Iconography (library or custom set; stroke/filled; weight) | **BLANK — TODO** — needed for: tabs, weather, location, prevention actions, reports, assistant, settings |
| Illustration style (onboarding, empty/error states) | **BLANK — TODO — or explicitly “none, use icon + copy only”** |
| Photography / imagery art direction | **BLANK — TODO** — Nigerian people/places/environments, consent, licensing; or explicitly “no photography” |
| Brand motif / signature chrome (`{product.signature-chrome}`) | **BLANK — TODO — none by default; do not invent one (e.g., map pins, net patterns)** |
| Favicon / PWA icon | **BLANK — TODO only if a web surface ever exists** |

### Usage rules (locked, apply once artwork exists)
1. Never recolor, restack, outline, stretch, or add shadows to the logo/mark.
2. Never place the logo on busy imagery without enough contrast (scrim colour BLANK).
3. App icon and mark-only logo must read at small sizes in bright light — test at 24px.
4. Icons must always pair with a text label in navigation and key actions (§13); icon-only is allowed only for universally understood chrome (back, close, search) with an accessibility label.
5. Do not create placeholder “logo-like” artwork (initials in a coloured circle, mosquito glyphs, crosses) and ship it as if it were the brand — use the text name “9ja Health” in `{typography.heading-md}` (BLANK font) until real artwork lands.

---

## 6. Spacing & layout

### Base (locked)
- Base unit: **8px** — tokens 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (`{spacing.*}`)
- Screen edge gutter: `{layout.gutter-phone}` **16px** (tablet `{layout.gutter-tablet}` 24px)
- Section rhythm on phone: `{spacing.section}` 32px between dashboard blocks; `{spacing.xl}` 24px inside dense detail screens

### Screen rhythm (phone, locked)
| Surface | Section gap | Card padding | Stack gap inside cards |
|---|---|---|---|
| Home dashboard | 24–32px | 16px (`{spacing.lg}`) | 8px (`{spacing.sm}`) |
| Outlook detail | 24px | 16px | 8px |
| Prevention | 24px | 12–16px | 8px |
| Reports list | 16–24px | 16px | 8px |
| Assistant | 12–16px (message rhythm) | 12px (bubbles) | 8px |
| Settings / forms | 24px | 16px | 12px |

### Dashboard card stack (Home, top→bottom — locked order, PM §22)
1. **Location header** — state/region + location status (GPS / manual / stale)
2. **Outlook card** (`{components.outlook-card}`) — the answer, first
3. **Environment / weather strip** (`{components.weather-strip}`)
4. **Prevention preview** — top 2–3 actions + “See all” → Prevention tab
5. **Latest Nigerian health update** (`{components.report-card}` preview) → Updates tab
6. **Assistant entry** — obvious ask-a-question affordance → Assistant tab
7. Disclaimer + sources footer (§9.9) — reachable without hunting

Image/media padding inside cards: **0** if imagery is ever used (direction BLANK, §5); data and copy are the default card content.

### Containers
- Phone: full width minus 16px gutters; no multi-column grids below 640px
- Tablet/large: single reading column capped at `{layout.reading-max}` 560px, centred; do not stretch dashboard cards edge-to-edge (§11)

---

## 7. Elevation & depth

| Level | Treatment | Use |
|---|---|---|
| 0 Flat | No shadow | Default screens, resting cards, headers, tab bar |
| 1 Hairline | 1px `{colors.hairline}` (BLANK colour) | Dividers, input borders, card separation alternative |
| 2 Sticky edge | Hairline on the sticking edge (spec TODO with colours) | Sticky header / action bar / assistant composer |
| 3 Float | Shadow — **BLANK: TODO offset/blur/colour/opacity (tied to palette)** | Dropdowns, menus, state-picker sheet |
| 4 Modal | Level 3 + `{colors.scrim}` (BLANK) | Modals, bottom sheets, permission education sheet |

**Principle (locked):** flat by default. This is a calm information app, not a layered material showcase. Depth only tells the user “this floated above that” — never decoration. Final shadow values are a brand-touch decision and stay BLANK until the palette exists.

---

## 8. Shapes

**Personality (locked):** all-rounded — soft companion UI, never clinical/sharp. Prefer the highest suitable radius; do not invent sharper corners for “serious” health moments (seriousness comes from copy and honesty, not sharp chrome).

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | **0px** | Full-bleed dividers / media edges only — avoid elsewhere |
| `{rounded.xs}` | **8px** | Tiny chrome, chart markers, nested micro-controls |
| `{rounded.sm}` | **12px** | Inputs, small controls |
| `{rounded.md}` | **16px** | Weather strip, prevention items, report cards, disclaimer |
| `{rounded.lg}` | **24px** | Outlook hero, chat bubbles, large panels, sheets |
| `{rounded.xl}` | **32px** | Modals, onboarding panels, bottom-sheet top corners |
| `{rounded.pill}` | **9999px** | Chips, badges, search, citation chips, circular icons |
| `{rounded.button}` | **9999px** | All CTAs — fully rounded (pill) |

**Rule:** Buttons, chips, and search are all pill. Cards and sheets use soft rects (`md`/`lg`/`xl`). Do not mix soft-rect CTAs with pill CTAs.

### Media geometry (only if imagery is introduced — direction BLANK, §5)
| Surface | Aspect | Notes |
|---|---|---|
| Report card media (optional) | **BLANK — TODO** | Default: no image; source/date carry trust |
| Onboarding / empty-state visual | **BLANK — TODO** | Default: icon/illustration placeholder area, no fake artwork |
| Outlook / trend visuals | Data-first | Soft area-line chart (§9.4), never decorative stock photos of illness |

---

## 9. Components & screens

### 9.1 Onboarding, location permission & manual state (PM §7–8)
- **No forced onboarding carousel.** If onboarding exists, it is ≤3 screens: (1) what 9ja Health does, (2) “not a diagnosis” honesty, (3) location ask. Skippable. Artwork BLANK (§5).
- Explain *before* the OS permission dialog (`{components.permission-prompt}`): why location helps, foreground-only, no continuous tracking, manual alternative exists (PM §31).
- **Permission denied is a first-class path, not an error dead-end:** manual state picker (searchable list of Nigerian states/regions) gets the full dashboard. Never loop permission nagging.
- Show location state honestly everywhere: `GPS · Kano` / `Manual · Kano` / `Last updated …` via the location header. Outside-Nigeria and unresolvable locations get a calm explanation + manual picker (PM §8).
- Location changes recompute the outlook; keep the previous result visible while refreshing (never flash a blank dashboard).

### 9.2 Buttons — visual component
| Variant | Visual anatomy |
|---|---|
| **Primary** | Pill (`{rounded.button}`), 48px tall, brand fill (BLANK) + on-primary text, horizontal padding 24px — one per screen region (“See my outlook”, “Ask a question”, “Allow location”) |
| **Secondary** | Same pill shell, canvas fill + secondary text + 1px secondary border — trust actions (“Choose state manually”, “View source”) |
| **Secondary filled** | Pill, secondary fill + on-secondary text — never competing with a primary in the same band |
| **Tertiary** | Text only, ink, no chrome (“Skip”, “Learn how this works”) |
| **Icon circular** | 40px visual / 48px hit, pill, surface-strong fill |

States every button ships: default · pressed (`-active`, optional `scale(0.98)` ≤100ms) · disabled · loading (inline spinner, label stays or becomes “Loading…”). Disabled buttons explain why nearby if the reason isn't obvious.

### 9.3 Location header — visual component
Horizontal row, not a heavy card: **pin/status icon (BLANK style) · state/region name (`{typography.heading-md}`) · status caption** (`GPS` / `Manual` / `Last updated…` in `{typography.caption}` `{colors.muted}`). Optional trailing “Change” tertiary control ≥44px. Flush with header; no border except optional soft bottom hairline.

### 9.4 Outlook card — visual component (Home hero — PM §22)
The most important card in the app. Soft rounded panel `{rounded.lg}` 24px, `{colors.surface-card}`, padding 16px, full-width in the content column. Internal stack (top→bottom, `{spacing.sm}` gaps):
1. **Risk badge** (`{components.risk-badge}`) — pill, top-left; Low / Moderate / Elevated / High text always visible (*model categories, not clinical thresholds* — PM §15)
2. **Plain-language headline** (`{typography.body-lg}`) — e.g. “Malaria incidence is estimated to be elevated in Kano this year.”
3. **Area-level guardrail** — always present, never micro-type: “This describes your area, not your personal risk.”
4. **Period + updated timestamp** — caption row
5. **Source row** (`{components.source-row}`) — e.g. Malaria Atlas Project + chevron → Outlook detail

Whole card is one tap target to Outlook. Never show a personal %, “your risk score”, or diagnosis-style verdict.
**Stale-data variant:** same layout + muted banner strip inside the card (“Showing outlook from Tue 11 Nov — couldn't refresh”) + retry pill button. Never silently present stale as fresh.

**Risk badge visual:** pill chip, padding 4×10, `{typography.badge}`, colour from `risk-*` tokens (BLANK) + **text label mandatory**. Selected/focused = 2px border-strong ring with 2px canvas gap — never colour alone.

### 9.5 Weather strip — visual component
Rounded panel `{rounded.md}` 16px on `{colors.canvas-soft}`, padding 12px. Phone: **2×2 grid** of four equal cells (Temperature · Humidity · Rainfall · Wind); tablet: 4-across. Each cell: **large tabular value** (`{typography.data-value}`) over **small label** (`{typography.data-label}` `{colors.muted}`), optional tiny weather icon above (BLANK icon set). No mini-charts inside the strip. Plain-language one-liner may sit above the grid (“Warm and humid, rain likely later”).

### 9.6 Prevention checklist item — visual component
Rounded row-card `{rounded.md}`, surface-card, padding 12px, min-height 48px. Left: circular checkbox (pill, 24px visual / 44px hit). Center stack: **action title** (`body-strong`) · **why in one line** (`body-sm` muted) · optional source caption. Trailing optional info chevron. Completed: success colour (BLANK) on check + strikethrough or muted title — encouraging, never streak/shame UI.

### 9.7 Report card — visual component
Rounded `{rounded.md}` surface-card, padding 16px. Stack: **topic/urgency badge** (pill, top) · **title** (`body-strong`) · **AI summary** block with a small pill label **“AI summary”** · **source · date** caption row · trailing “Read original” tertiary. No hero photo by default. List density: 16–24px between cards.

### 9.8 Chat bubbles & citation chips — visual components
| Piece | Visual |
|---|---|
| **User bubble** | Right-aligned, primary fill (BLANK) + on-primary text, `{rounded.lg}` 24px, max-width ~80% |
| **Assistant bubble** | Left-aligned, surface-card, ink text, `{rounded.lg}` 24px, max-width ~85%; citations row under the bubble |
| **Citation chip** | Pill, surface-strong, caption text, height 32px / hit 44px — tappable to open source |
| **Composer** | Sticky bottom: pill search-like input 48px + circular send 48px; safe-area aware |

### 9.9 Disclaimer banner — visual component
Full-width soft band `{rounded.md}`, canvas-soft, padding 12px. Leading info icon (BLANK) + body-sm text. Not dismissible on Home/Outlook/Assistant; Settings shows the full legal version. Same wording intent everywhere (§9.15).

### 9.10 Safety escalation card — visual component
Sits **above** the next assistant reply (not a toast). `{rounded.lg}`, stronger border (`border-strong` or warning token when filled), padding 16px. Stack: clear title (“Please seek care”) · body message · primary pill CTA if deep-link/phone guidance exists later · tertiary “I understand”. Interrupts casual chat styling on purpose (PM §19).

### 9.11 Filter chips, search, inputs — visual components
- **Search:** 44px, pill, canvas-soft fill — report search, state search
- **Text input:** 48px, `{rounded.sm}` 12px, surface-card, 1px hairline; focus = 2px border-strong; error = 2px error + helper *words*
- **Filter chip:** 40px, pill, hairline border; active = secondary fill + on-secondary text (+ weight change so colour isn’t the only signal)
- **State picker rows:** ≥48px, checkmark + text for selection (not colour only)

### 9.12 Navigation chrome — visual components
- **Bottom tab bar:** canvas + top hairline, height 64px + safe area. Five tabs: Home · Outlook · Prevention · Assistant · Updates. Each: icon (BLANK) over label (`tab-label`). Active = activeTextColor (BLANK) **and** heavier/filled icon variant — never colour alone.
- **Top header:** 56px, canvas; Home shows location header; detail shows back + title; Settings from Home (icon + accessible name). No hamburger on phone.
- **Sticky action bar:** 64px + safe area, top hairline, primary pill CTA right / price-or-context left (where needed). Reserve bottom padding so content isn’t hidden.
- Deep links / notifications land cold-ready (location + disclaimer intact). **No rotate-upright block** (§11.4).

### 9.13 Outlook detail screen composition (PM §23)
Goal: **explainability, not a mysterious AI score.** Vertical stack:
1. Outlook card content (same language as Home) without needing a nested card chrome if already on a detail canvas
2. Paired “What this means / what this does not mean” — two equal soft panels `{rounded.md}`
3. **Trend chart** (`{components.trend-chart}`) — soft area-line (§ below)
4. Key factors / environmental context (temperature, rainfall, humidity as *context*, never “rain caused your risk” — PM §37)
5. Expanded weather strip
6. Model limitations + sources + timestamps — visible without a buried “advanced” accordion
7. Prevention primary CTA → Prevention tab

**Trend chart visual (locked):** soft area-line; single primary series with rounded stroke + soft under-curve fill; optional dashed climate overlay; horizontal grid only; year/period X labels; plain-language Y unit (“Estimated cases per 1,000 people”); height ~180px phone / 220px tablet; **one-sentence text summary always** above or below for sighted + screen-reader users; empty copy: “Trend data isn't available for this area yet.” Series colours remain BLANK (`chart-series`).

### 9.14 Prevention screen (PM §16, §24)
Rules-based, evidence-based actions (deterministic engine — not LLM — PM §16). Each item = `{components.prevention-checklist-item}`.

**Locked group headers** (`{components.prevention-groups}`), shown in this order; within a group, order by relevance to current conditions (not A–Z):
1. **Around the home** — standing water, screens, household mosquito control
2. **When sleeping** — nets, indoor protection
3. **Out and about** — clothing, repellent, dusk/dawn awareness
4. **If someone feels unwell** — testing/care-seeking guidance (never diagnosis or dosage)

Home shows a preview of the top 2–3 items + “See all”. Checklist is encouraging, not gamified. Footer: general guidance only — not personal medical advice (§9.15).

### 9.15 Assistant screen (PM §17–19, §25)
- Scope strip at top (not a modal): what the assistant can/can't do.
- **Locked starter chips** (`{components.assistant-starter-questions}`), ≤6 visible, horizontal scroll OK:
  1. How does malaria spread?
  2. What can I do to prevent mosquito bites?
  3. What are common malaria symptoms?
  4. When should someone get tested?
  5. What does area-level risk mean?
  6. Why does rain matter for malaria here?
- Every substantive answer carries citation chips; no citation → admit information isn’t available; never invent a source.
- Loading: “Checking trusted sources…” under a quiet typing indicator. Error: calm retry, never a fabricated answer.
- Safety escalation uses `{components.safety-escalation-card}` (§9.10). Conversation history OK; label AI-generated information (§4).

### 9.16 Health Updates — list & detail (PM §20–21, §26)
- List of `{components.report-card}` + topic/state filter chips + search. Empty filter → honest empty state, not filler.
- Detail: full AI summary (labelled) clearly separated from **“Read the original”** (source, date, URL). AI is never the origin (PM §21).
- Urgency badge + words if shown (colours BLANK) — never alarm styling for routine updates.
- Sources: verified Nigerian authorities only (NCDC, Federal Ministry of Health and Social Welfare, NPHCDA, National Malaria Elimination Programme, other verified bodies — PM §20).

### 9.17 Settings (PM §27)
Location preference, notifications (if P1 ships), report preferences, privacy (foreground-only), data sources, full disclaimer, about/version. No account section in MVP. Rows ≥48px; destructive actions use error colour (BLANK) + confirm. Disclaimer/privacy ≤1 tap away.

### 9.18 Disclaimer & trust pattern (locked — Home, Outlook, Assistant, Settings)
- `{components.disclaimer-banner}`: **“9ja Health provides health information and area-level estimates. It is not a diagnosis and does not replace a health professional.”** Same intent everywhere — do not soften per screen.
- Sources & timestamps on every claim: prediction (MAP + model date), weather (Open-Meteo + fetch time), reports (authority + publication date), assistant (citations). Missing source → say so.

### 9.19 States for every data surface (locked)
Every async surface ships:
- **Loading:** soft-pulse skeleton matching real rounded card shapes (§12) + calm status copy; previous data stays visible on refresh
- **Empty:** what’s missing + what to do; illustration BLANK (§5); never blank white
- **Error/offline:** plain words + whether cache is shown + retry ≥48px; codes to logs only
- **Permission-denied:** §9.1 manual path. **Model/weather unavailable:** honest unavailable — never mock predictions as real

---

## 10. Do's and don'ts

### Do
- Lead every screen with the answer, then the explanation, then the detail
- Pair every number with a plain-language meaning, a source, and a date
- Say “area-level” every time a prediction could be mistaken for personal risk
- Keep prevention small, doable, and encouraging
- Design permission-denied, offline, stale-data, and model-failure states as real screens
- Use token names everywhere so BLANK brand values can land without refactors
- Test on low-end Android, small screens (360px), and in bright light
- Write copy in the calm, clear, non-alarmist voice (§4)

### Don't
- Don't invent colours, fonts, logos, icons, or illustrations (BLANK, §15); use locked radii, chart style, and motion as written
- Don't present “your chance of malaria”, personal risk scores, diagnoses, prescriptions, or dosages
- Don't use fear, alarm styling, or hype to drive engagement with health information
- Don't hide sources, timestamps, limitations, or the disclaimer in hard-to-find places
- Don't require an account to read health information in the MVP
- Don't build dark mode (or lock light-only) before `colors.color-mode` is decided
- Don't block health information behind a rotate-your-phone notice
- Don't theme the whole brand around malaria/mosquitoes, a flag, or hospital clichés by assumption
- Don't show fake/mock predictions, reports, or sources as real — label development mock data as mock
- Don't let the assistant answer without citations or invent a source

---

## 11. Responsive & device behaviour

### 11.1 Device classes
| Name | Width | Notes |
|---|---|---|
| Small phone | 320–374px | Must stay fully usable — shrink gaps, never truncate health meaning |
| Phone portrait | 375–639px | **Primary design target** |
| Phone landscape | landscape, short height | Allowed, not optimised (§11.4) |
| Tablet portrait | 640–1023px | Single column, `{layout.reading-max}` cap |
| Large / tablet landscape / foldable | ≥1024px | Same column cap; more breathing room, not a web dashboard |

### 11.2 Collapsing
| Element | Phone | Tablet / large |
|---|---|---|
| Navigation | Bottom tabs (5) | Bottom tabs or same tabs centred; no desktop link nav |
| Dashboard | Single column card stack | Single column, 560px reading cap |
| Weather strip | 2×2 grid or horizontal scroll of 4 stats | 4-across row inside the cap |
| Charts | Full-width, simplified labels | Same chart, wider — no extra desktop-only series |
| Assistant | Full-screen chat | Centred column, same bubbles |
| Sheets/pickers | Bottom sheet / full-screen | Centred modal, max-width cap |

### 11.3 Touch & device realities
44px min · 48px primary · icon 40/48 · chips 40 · inputs 48 · list rows ≥48 · safe-area for tab/sticky bars. Assume: low-end Android performance, intermittent network, cached-last-outlook behaviour, OS font-size scaling (layout must survive 130%+ text scaling without clipping the outlook headline or disclaimer), and one-handed use (primary actions reachable in the lower half).

### 11.4 Phone landscape — information is never blocked
Unlike TPM, **do not show a rotate-upright shopping block**. A user checking a health outlook lying down, on a shared phone, or with a disability that fixes orientation must still read everything. Landscape may scroll more and charts may simplify — content, disclaimer, and sources remain fully available.

### 11.5 Data visuals & media
- Charts: label axes in words, provide a text summary alternative, never rely on colour alone to distinguish series (series colours BLANK).
- Any future imagery: lazy-load, cache, and never let image failure remove the health information it decorated (art direction BLANK, §5).

---

## 12. Motion

**Personality (locked): `quiet-settle`.** Soft ease-out into rest. Things arrive and stay — no bounce, no spring, no playful loops. Motion never delays a health answer. Honour OS “reduce motion” by dropping non-essential animation (skeletons become static placeholders; chart draws as the final frame).

| Interaction | Motion |
|---|---|
| Bottom sheet / picker | 200–250ms ease-out (`motion-duration-default` ≈ 220ms) |
| Tab switch | Instant content change or ≤150ms fade — no celebratory animation |
| Sticky bar / composer appear | 150ms fade/slide |
| Button press | Instant `-active` colour swap (optional `scale(0.98)` ≤100ms) |
| Card refresh (new outlook) | Subtle cross-fade; previous data visible until new data lands |
| Loading skeleton | **soft-pulse** — opacity 0.45→1.0 over ~1.2s on rounded skeleton blocks that mirror real card geometry |
| Chart draw | **left-to-right-once** — soft path draw ~500ms ease-out on first paint, then static; reduce-motion → instant final frame |

### Haptics & sound (locked)
| Policy | Rule |
|---|---|
| **Sound** | **Silent** — no UI sounds in the MVP |
| **Haptics** | **Selective light** only — never continuous/alarming vibration patterns |
| Light haptic | Primary CTA press · prevention item completed · assistant message send |
| Medium haptic | Safety escalation card appears (attention without panic) |
| No haptic | Tab switches · scrolling · loading · ordinary errors (errors stay visual + text) · filter chips |

---

## 13. Accessibility

- Verify WCAG AA contrast for every filled colour combination (§2) — including risk badges and chart series — and re-verify for bright-sunlight use.
- Focus/selection ring: 2px solid — **BLANK: TODO colour token** (must not be colour-only on soft surfaces).
- Icon-only controls need accessibility labels; tab icons always have visible text labels.
- Risk, error, success, and urgency meaning always includes **text**, never colour alone (§2).
- Screen-reader order on the outlook card: headline → category label → area-level guardrail → period → source. Chart has a spoken/text summary.
- Support OS text scaling to at least 130% without clipping headlines, badges, or the disclaimer; allow wrapping over truncation for health copy.
- Minimum touch targets §11.3; assistant escalation card (§9.6) is reachable and announced, not a transient toast.
- Location-denied, offline, and error states are announced politely (not assertively) by assistive tech; loading states don't trap focus.

---

## 14. Iteration guide

1. Token *structure* in this file is locked — change names/roles only with a documented reason; token *values* marked BLANK change only when the product owner / brand designer fills them (§15).
2. Fill remaining blanks in dependency order: palette + colour-mode → typography → elevation tint/scrim → logo/icons/imagery. Radius, chart style, motion, and haptics are already locked. Record filled values in the YAML frontmatter *and* the matching prose section — keep them synced (TPM method).
3. One screen/component at a time; reference tokens by path; states as separate entries (`-active`, `-disabled`, `-focused`, plus `-loading/-empty/-error` for data surfaces).
4. Default body `{typography.body-md}` (BLANK); emphasis `{typography.body-strong}` (BLANK) — once filled.
5. QA viewports/devices: 320px small Android, 360–375px phone portrait, 768px tablet portrait, phone landscape (information visible), 130% text scaling, offline + GPS-denied + stale-data runs, bright-light contrast check.
6. Copy QA on every screen: no personal-risk phrasing, no missing source/date, disclaimer present, escalation path present in Assistant (PM §37–38, §41).

---

## 15. Remaining open items — THE BLANK REGISTER

> Still blank = special brand/design touch required. Agents: do not invent these.
> **Filled this pass (do not reopen without product owner):** all-rounded shape (§8), soft area-line chart style (§9.13), `quiet-settle` motion + soft-pulse skeletons + L→R chart draw (§12), selective-light haptics / silent sound (§12), prevention groups + assistant starters (§9.14–9.15).

### A. Colour (all of §2)
1. `colors.primary`, `primary-active`, `primary-disabled` — hex values
2. `colors.secondary`, `secondary-active` — hex values
3. `colors.accent` — hex value, or decision that no accent exists
4. `colors.on-primary`, `on-secondary` — hex values
5. `colors.color-mode` (+ `product.color-mode`) — light-only / dark-only / both / system
6. `colors.canvas`, `canvas-soft`, `surface-card`, `surface-strong` — hex values
7. `colors.ink`, `body`, `muted`, `muted-soft`, `on-dark` — hex values
8. `colors.hairline`, `hairline-soft`, `border-strong`, `scrim` (colour + opacity) — values
9. `colors.success`, `error`, `warning`, `info` — hex values
10. `colors.risk-low`, `risk-moderate`, `risk-elevated`, `risk-high` — hex values + category colour mapping rationale (accessibility-tested)
11. `colors.chart-series` — chart palette only (chart *geometry/style* is locked)
12. `colors.brand-mix` — brand colour mix/ratio, if any rule is wanted at all
13. `components.bottom-tab-bar.activeTextColor` and the focus-ring colour (§13) — token + value
14. Shadow/elevation tint values (§7, Levels 3–4) — offset/blur/colour/opacity (structure locked; colour tied to palette)

### B. Typography (all of §3)
15. `typography.font-display`, `font-body`, `font-mono` — families + fallback stacks
16. `typography.font-import` — Expo font loading assets/URL + offline bundling decision
17. `typography.font-optical-sizing` — if applicable to the chosen display font
18. Every type token's size / weight / line-height / letter-spacing: `display-xl`, `display-lg`, `display-md`, `heading-xl`, `heading-lg`, `heading-md`, `body-lg`, `body-md`, `body-strong`, `body-sm`, `caption`, `micro` (incl. its readable floor), `badge`, `button-md`, `button-sm`, `tab-label`, `data-value`, `data-label`
19. Verification that chosen fonts cover Nigerian names/places/diacritics and don't block future Nigerian-language support

### C. Logo, iconography, imagery & brand identity (all of §5)
20. `brand-assets.logo-full` — artwork files, formats, folder (`Assets folder` in the header is also BLANK until this lands)
21. `brand-assets.logo-mark-only` — artwork files
22. `brand-assets.app-icon` — iOS/Android/store artwork
23. `brand-assets.splash-screen` — artwork + background + behaviour
24. Wordmark anatomy for “9ja Health” (depends on B)
25. `layout.logo-nav-height`, `layout.logo-clear-space`, `layout.app-icon-size` — logo sizing/clear-space values
26. `brand-assets.iconography` — icon library/custom set, stroke-vs-filled, weight (tab, weather, location, prevention, report, assistant, settings icons)
27. `brand-assets.illustration-style` — onboarding/empty/error illustration approach, or explicit “none”
28. `brand-assets.photography-imagery` — photography art direction (Nigerian contexts, consent, licensing), or explicit “no photography”; plus §8 media aspect ratios if used
29. `brand-assets.brand-motif` / `product.signature-chrome` — signature motif, or explicit “none”

### D. Still open (feature-gated)
30. Whether notifications exist in the MVP visual system (bell/badge styling) — PM lists notifications as P1; no component is locked until the feature is confirmed
31. Prevention group / starter-question *medical wording polish* — structure is locked; a content reviewer may refine phrasing without changing the groups or the six starter intents

---

## 16. Quick reference

```
Product:          9ja Health (brand NOT malaria-specific)
Category:         AI-powered health & environmental intelligence
Initial focus:    Malaria — AREA-LEVEL annual incidence, never personal risk
Market:           Nigeria (state/region from foreground GPS, manual fallback)
Platform:         React Native + Expo + TypeScript — mobile app, portrait-first
Core promise:     Understand your environment. Stay informed. Make better health decisions.
Pipeline:         Location → Climate → ML → Intelligence → Prevention → Trusted info
Feel:             Calm, clear, trustworthy, plain-language, non-alarmist daily companion
Navigation:       Bottom tabs — Home · Outlook · Prevention · Assistant · Updates (+ Settings via header)
Screens:          Dashboard / Outlook detail / Prevention / Assistant / Updates / Settings
Trust pattern:    Source + timestamp on every claim; disclaimer in context, never buried
Safety:           Information, not diagnosis; no prescription/dosage; seek-care escalation
Accounts:         Not required for MVP
Tracking:         Foreground location only, no continuous/background tracking
Spacing:          8px base · 16px phone gutter · 44px min touch / 48px primary
Shape:            All-rounded — buttons/chips pill 9999px; cards 16–24px; sheets/modals 24–32px
Chart:            Soft area-line + text summary; horizontal grid; chart-series colours BLANK
Motion:           quiet-settle · soft-pulse skeletons · L→R chart draw once · ease-out
Haptics/sound:    Selective light haptics · silent UI (no sounds)
Prevention groups: Around the home · When sleeping · Out and about · If someone feels unwell
Landscape:        Allowed — health info never blocked by a rotate notice
Colour:           BLANK — TODO (all tokens, risk mapping, colour-mode) §2/§15A
Typography:       BLANK — TODO (families, import, full scale) §3/§15B
Logo/icons/art:   BLANK — TODO (logo, app icon, splash, iconography, imagery, motif) §5/§15C
Assets folder:    BLANK — TODO (create when brand assets exist)
```


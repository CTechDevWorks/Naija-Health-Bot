# 9ja Health (mobile)

React Native + Expo app for **9ja Health** — AI-powered health and environmental intelligence for Nigeria (malaria area-level outlook first).

## Stack

- Expo Router (tabs: Home · Outlook · Prevention · Assistant · Updates)
- TypeScript
- StyleSheet + design tokens in `src/constants/theme.ts`
- Inter via `@expo-google-fonts/inter`
- TanStack Query, Zod, AsyncStorage, expo-location, expo-notifications

## Run

```bash
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_BASE_URL` when the FastAPI backend is available (see root `.env.example` when added).

## Structure

```text
src/
  app/           # Expo Router screens
  components/    # UI building blocks
  constants/     # Design tokens
  services/      # API client
  types/         # Shared types
  hooks/         # Feature hooks (as needed)
assets/brand/    # Logo placeholder (final brand TBD)
```

## Notes

- Not a diagnostic tool. Area-level estimates only.
- Daily health reports come from the backend 06:30 Africa/Lagos scheduler (no Zapier).
- Final logo/app icon are deferred; `assets/brand/logo-placeholder.jpeg` is temporary.

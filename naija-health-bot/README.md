# 9ja Health — mobile app

Expo / React Native client for **9ja Health**. Project overview, problem framing, and full setup: **[../README.md](../README.md)**.

## Run

```bash
npm ci
npx expo start
```

Configure `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_OPENWEATHER_API_KEY`, and (optional) `EXPO_PUBLIC_SUPABASE_*` in `.env`.

## Checks

```bash
npx tsc --noEmit
npx expo lint
```
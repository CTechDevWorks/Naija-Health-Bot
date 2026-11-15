/**
 * The Supabase client, used only for accounts (sign-up, sign-in, two-factor).
 *
 * Saved conversations do not go through here: the app sends the signed-in
 * user's token to the 9ja Health API, which reads and writes history.
 *
 * Both values are public by design. EXPO_PUBLIC_* variables are compiled into
 * the app, so only the project URL and the "anon" / publishable key belong
 * here. The service_role / secret key must never be put in the app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/** True for a key that grants full database access and must not ship in an app. */
function isPrivilegedKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json).role === "service_role";
  } catch {
    return false;
  }
}

const privileged = anonKey.length > 0 && isPrivilegedKey(anonKey);
if (privileged) {
  console.error(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY holds a service_role / secret key. Accounts are " +
      "switched off. Replace it with the anon / publishable key, and rotate the " +
      "secret key in the Supabase dashboard because it has been exposed to the app.",
  );
}

export function isAccountsConfigured(): boolean {
  return url.length > 0 && anonKey.length > 0 && !privileged;
}

let client: SupabaseClient | null = null;

/** The client, or null when accounts are not configured or there is no device yet. */
export function getSupabase(): SupabaseClient | null {
  if (!isAccountsConfigured()) return null;
  // Expo renders web pages once on the server, where there is nowhere to keep
  // a session. The client is created in the browser or on the phone only.
  if (Platform.OS === "web" && typeof window === "undefined") return null;

  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        // Web keeps the session in the browser's localStorage (the default).
        ...(Platform.OS === "web" ? {} : { storage: AsyncStorage }),
        autoRefreshToken: true,
        persistSession: true,
        // No magic links or social sign-in, so there is nothing to read from a URL.
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

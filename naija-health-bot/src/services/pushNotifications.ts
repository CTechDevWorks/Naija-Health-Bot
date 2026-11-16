/**
 * Expo push registration for “new health update published” alerts.
 * Tokens are stored by the FastAPI backend; the daily job sends via Expo Push.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { apiBaseUrl, AssistantApiError, errorDetail } from "./assistantApi";

const PREF_KEY = "naija-health.push-updates.enabled.v1";
const TOKEN_KEY = "naija-health.push-updates.token.v1";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function loadUpdatePushPreference(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREF_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function saveUpdatePushPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_KEY, enabled ? "1" : "0");
}

function projectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    undefined
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("health-updates", {
    name: "Health updates",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#7DBA84",
  });
}

export async function getExpoPushToken(): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("Push notifications are not available on web.");
  }
  if (!Device.isDevice) {
    throw new Error(
      "Push notifications need a physical phone. Simulators cannot receive them.",
    );
  }

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") {
    throw new Error(
      "Notification permission was not granted. You can enable it in system settings.",
    );
  }

  const id = projectId();
  const tokenResponse = id
    ? await Notifications.getExpoPushTokenAsync({ projectId: id })
    : await Notifications.getExpoPushTokenAsync();
  const token = tokenResponse.data?.trim();
  if (!token) {
    throw new Error("Could not get a push token from Expo.");
  }
  return token;
}

async function syncTokenWithBackend(
  token: string,
  enabled: boolean,
): Promise<void> {
  const root = apiBaseUrl();
  if (!root) {
    throw new AssistantApiError(
      "Backend URL is not set. Add EXPO_PUBLIC_API_BASE_URL and restart Expo.",
    );
  }

  const platform =
    Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web"
      ? Platform.OS
      : "unknown";

  let response: Response;
  try {
    response = await fetch(`${root}/api/v1/push-tokens`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, platform, enabled }),
    });
  } catch {
    throw new AssistantApiError(
      "Could not reach the server to save notification settings.",
      0,
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AssistantApiError(
      errorDetail(payload, "Could not save notification settings."),
      response.status,
    );
  }
}

/**
 * Turn health-update push on or off. Requests permission when enabling.
 */
export async function setUpdatePushEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    const cached = await AsyncStorage.getItem(TOKEN_KEY);
    if (cached) {
      try {
        await syncTokenWithBackend(cached, false);
      } catch {
        // Still clear local preference if the server is briefly unreachable.
      }
    }
    await saveUpdatePushPreference(false);
    return;
  }

  const token = await getExpoPushToken();
  await syncTokenWithBackend(token, true);
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await saveUpdatePushPreference(true);
}

/** Re-register if the user previously opted in (call on app launch). */
export async function refreshUpdatePushRegistration(): Promise<void> {
  const enabled = await loadUpdatePushPreference();
  if (!enabled) return;
  try {
    const token = await getExpoPushToken();
    await syncTokenWithBackend(token, true);
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.warn("push re-register skipped:", error);
  }
}

export function notificationWantsUpdates(
  data: Record<string, unknown> | undefined,
): boolean {
  return data?.screen === "updates";
}

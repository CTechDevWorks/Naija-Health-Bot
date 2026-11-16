import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import {
  loadUpdatePushPreference,
  notificationWantsUpdates,
  refreshUpdatePushRegistration,
  setUpdatePushEnabled,
} from "@/services/pushNotifications";

type UpdatePushContextValue = {
  enabled: boolean;
  busy: boolean;
  error: string | null;
  setUpdateAlerts: (next: boolean) => Promise<void>;
};

const Context = createContext<UpdatePushContextValue | null>(null);

/**
 * Owns the “notify me when a health update is published” preference and
 * opens the Updates tab when a related notification is tapped.
 */
export function UpdatePushProvider({ children }: PropsWithChildren) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const pref = await loadUpdatePushPreference();
      if (alive) setEnabled(pref);
      await refreshUpdatePushRegistration();
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        if (notificationWantsUpdates(data)) {
          router.push("/updates");
        }
      },
    );
    return () => sub.remove();
  }, []);

  const setUpdateAlerts = useCallback(async (next: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await setUpdatePushEnabled(next);
      setEnabled(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update notification settings.",
      );
      const pref = await loadUpdatePushPreference();
      setEnabled(pref);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Context.Provider value={{ enabled, busy, error, setUpdateAlerts }}>
      {children}
    </Context.Provider>
  );
}

export function useUpdatePush() {
  const value = useContext(Context);
  if (!value) {
    throw new Error("UpdatePushProvider is required");
  }
  return value;
}

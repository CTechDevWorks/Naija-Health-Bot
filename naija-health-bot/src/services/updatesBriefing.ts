import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "naija-health.updates-briefing.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export type UpdatesBriefing = {
  title: string;
  summary: string;
  /** ISO timestamp when the briefing was produced. */
  generatedAt: string;
  sources?: { title: string; url: string }[];
};

export async function loadUpdatesBriefing(): Promise<UpdatesBriefing | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UpdatesBriefing;
    if (!parsed?.generatedAt || !parsed.summary) return null;
    const age = Date.now() - new Date(parsed.generatedAt).getTime();
    if (!Number.isFinite(age) || age < 0 || age >= DAY_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Save a briefing so the Updates page can show it for the next 24 hours. */
export async function saveUpdatesBriefing(
  briefing: UpdatesBriefing,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(briefing));
}

export function formatBriefingAge(generatedAt: string): string {
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Loads published health reports from the FastAPI backend
 * (which reads Supabase `health_reports`).
 */

import { apiBaseUrl, AssistantApiError, errorDetail } from "./assistantApi";

export type HealthReportSource = {
  id: string;
  slug: string;
  name: string;
  region?: string | null;
};

export type HealthReport = {
  id: string;
  title: string;
  summary: string;
  original_url: string;
  published_at: string;
  ingested_at?: string | null;
  topic: string;
  location_scope: string;
  urgency: string;
  is_ai_summary: boolean;
  source: HealthReportSource | null;
};

export async function fetchHealthReports(
  limit = 30,
  signal?: AbortSignal,
): Promise<HealthReport[]> {
  const root = apiBaseUrl();
  if (!root) {
    throw new AssistantApiError(
      "The updates feed is not connected yet. Set EXPO_PUBLIC_API_BASE_URL and restart Expo.",
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${root}/api/v1/health-reports?limit=${encodeURIComponent(String(limit))}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      },
    );
  } catch {
    throw new AssistantApiError(
      "Could not reach the updates service. Check your connection and try again.",
      0,
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AssistantApiError(
      errorDetail(payload, "Health updates are unavailable right now."),
      response.status,
    );
  }

  const reports = (payload as { reports?: HealthReport[] } | null)?.reports;
  return Array.isArray(reports) ? reports : [];
}

export function formatReportDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function topicLabel(topic: string): string {
  const map: Record<string, string> = {
    disease: "Disease",
    policy: "Policy",
    vaccine: "Vaccine",
    outbreak: "Outbreak",
    medical_tech: "Medical tech",
    guidance: "Guidance",
    other: "Update",
  };
  return map[topic] ?? "Update";
}

export function urgencyLabel(urgency: string): string {
  if (urgency === "high") return "High urgency";
  if (urgency === "medium") return "Medium urgency";
  return "Update";
}

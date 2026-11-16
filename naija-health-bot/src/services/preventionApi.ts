/**
 * Talks to POST /api/v1/prevention on EXPO_PUBLIC_API_BASE_URL.
 * The trained model stays on the server — the app only displays the report.
 */

import {
  apiBaseUrl,
  apiHeaders,
  errorDetail,
} from "@/services/assistantApi";

export type PreventionTip = {
  id: string;
  title: string;
  body: string;
  group: string;
};

export type PreventionFactor = {
  label: string;
  detail: string;
};

export type PreventionReport = {
  state: string;
  incidencePer1000: number;
  category: string;
  period: string;
  predictionYear: number;
  featureYear: number;
  factors: PreventionFactor[];
  tips: PreventionTip[];
  modelVersion: string;
  updatedAt: string;
  limitations: string[];
  disclaimer: string;
};

export class PreventionApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "PreventionApiError";
    this.status = status;
  }
}

export function isPreventionConfigured(): boolean {
  return apiBaseUrl().length > 0;
}

type PreventionApiPayload = {
  state: string;
  incidence_per_1000: number;
  category: string;
  period: string;
  prediction_year: number;
  feature_year: number;
  factors: { label: string; detail: string }[];
  tips: { id: string; title: string; body: string; group: string }[];
  model_version: string;
  updated_at: string;
  limitations?: string[];
  disclaimer?: string;
};

export async function fetchPreventionReport(input: {
  latitude: number;
  longitude: number;
  state: string;
  signal?: AbortSignal;
}): Promise<PreventionReport> {
  const root = apiBaseUrl();
  if (!root) {
    throw new PreventionApiError(
      "Prevention is not connected yet. Set EXPO_PUBLIC_API_BASE_URL and restart Expo.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${root}/api/v1/prevention`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        latitude: input.latitude,
        longitude: input.longitude,
        state: input.state,
      }),
      signal: input.signal,
    });
  } catch (error) {
    if (input.signal?.aborted) throw error;
    throw new PreventionApiError(
      "Could not reach the Prevention service. Check that the AI server is running and try again.",
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new PreventionApiError(
      errorDetail(
        payload,
        "The Prevention report could not be generated. Please try again.",
      ),
      response.status,
    );
  }

  const body = payload as PreventionApiPayload;
  return {
    state: body.state,
    incidencePer1000: body.incidence_per_1000,
    category: body.category,
    period: body.period,
    predictionYear: body.prediction_year,
    featureYear: body.feature_year,
    factors: (body.factors ?? []).map((factor) => ({
      label: factor.label,
      detail: factor.detail,
    })),
    tips: (body.tips ?? []).map((tip) => ({
      id: tip.id,
      title: tip.title,
      body: tip.body,
      group: tip.group,
    })),
    modelVersion: body.model_version,
    updatedAt: body.updated_at,
    limitations: body.limitations ?? [],
    disclaimer:
      body.disclaimer ??
      "Area-level estimate only — not your personal chance of illness, and not a diagnosis.",
  };
}

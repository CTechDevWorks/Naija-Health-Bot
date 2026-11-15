/**
 * Talks to the FastAPI assistant at EXPO_PUBLIC_API_BASE_URL.
 * The BluesMinds key stays on the server — this client only sends chat text,
 * plus the signed-in user's own token when there is one.
 */

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantSource = {
  id: string;
  title: string;
  organisation: string;
  url: string;
};

export type AssistantApiReply = {
  text: string;
  urgent: boolean;
  sources: AssistantSource[];
  model: string;
  guardrail: string | null;
  /** The saved conversation this exchange belongs to; null for guests. */
  conversationId: string | null;
  /** True only when the server stored this exchange in the user's history. */
  saved: boolean;
};

export type AskOptions = {
  signal?: AbortSignal;
  /** The signed-in user's access token. Leave out for guests. */
  token?: string | null;
  /** Continue this saved conversation (signed-in users only). */
  conversationId?: string | null;
};

export class AssistantApiError extends Error {
  /** HTTP status, or 0 when the server could not be reached. */
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "AssistantApiError";
    this.status = status;
  }
}

export function apiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";
  return raw.replace(/\/$/, "");
}

export function isAssistantConfigured(): boolean {
  return apiBaseUrl().length > 0;
}

export function apiHeaders(token?: string | null): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** The server's own explanation for a failed request, when it sent one. */
export function errorDetail(payload: unknown, fallback: string): string {
  const detail = (payload as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" && detail ? detail : fallback;
}

export async function askAssistant(
  history: ChatTurn[],
  { signal, token, conversationId }: AskOptions = {},
): Promise<AssistantApiReply> {
  const root = apiBaseUrl();
  if (!root) {
    throw new AssistantApiError(
      "The assistant is not connected yet. Set EXPO_PUBLIC_API_BASE_URL and restart Expo.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${root}/api/v1/chat`, {
      method: "POST",
      headers: apiHeaders(token),
      body: JSON.stringify({
        messages: history,
        ...(token && conversationId ? { conversation_id: conversationId } : {}),
      }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AssistantApiError(
      "Could not reach the assistant. Check that the AI server is running and try again.",
    );
  }

  let payload: {
    response?: string;
    urgent?: boolean;
    sources?: AssistantSource[];
    model?: string;
    guardrail?: string | null;
    conversation_id?: string | null;
    saved?: boolean;
    detail?: string | { msg?: string }[];
  };
  try {
    payload = await response.json();
  } catch {
    throw new AssistantApiError(
      "The assistant sent an unexpected reply. Please try again in a moment.",
      response.status,
    );
  }

  if (!response.ok) {
    throw new AssistantApiError(
      errorDetail(
        payload,
        "The assistant could not answer just now. Please try again shortly.",
      ),
      response.status,
    );
  }

  const text = (payload.response ?? "").trim();
  if (!text) {
    throw new AssistantApiError(
      "The assistant returned an empty answer. Please try again.",
      response.status,
    );
  }

  return {
    text,
    urgent: Boolean(payload.urgent),
    sources: Array.isArray(payload.sources) ? payload.sources : [],
    model: payload.model ?? "unknown",
    guardrail: payload.guardrail ?? null,
    conversationId: payload.conversation_id ?? null,
    saved: Boolean(payload.saved),
  };
}

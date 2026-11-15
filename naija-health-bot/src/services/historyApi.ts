/**
 * Saved conversations, through the 9ja Health API.
 *
 * Every call needs the signed-in user's access token. The server refuses
 * guests and sessions that have not passed the authenticator step.
 */
import {
  apiBaseUrl,
  apiHeaders,
  AssistantApiError,
  AssistantSource,
  errorDetail,
} from "./assistantApi";

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type SavedMessage = {
  role: "user" | "assistant";
  content: string;
  urgent: boolean;
  sources: AssistantSource[];
  createdAt: string | null;
};

export type ConversationDetail = ConversationSummary & {
  messages: SavedMessage[];
};

const UNAVAILABLE =
  "Saved conversations are unavailable just now. Please try again shortly.";

async function call(
  method: "GET" | "DELETE",
  path: string,
  token: string,
): Promise<unknown> {
  const root = apiBaseUrl();
  if (!root) {
    throw new AssistantApiError("The assistant is not connected yet.");
  }

  let response: Response;
  try {
    response = await fetch(`${root}/api/v1/conversations${path}`, {
      method,
      headers: apiHeaders(token),
    });
  } catch {
    throw new AssistantApiError(
      "Could not reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 204) return null;

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Handled below: a failed status keeps its fallback message.
  }
  if (!response.ok) {
    throw new AssistantApiError(
      errorDetail(payload, UNAVAILABLE),
      response.status,
    );
  }
  return payload;
}

type SummaryRow = { id: string; title: string; updated_at: string };

function toSummary(row: SummaryRow): ConversationSummary {
  return { id: row.id, title: row.title, updatedAt: row.updated_at };
}

export async function listConversations(
  token: string,
): Promise<ConversationSummary[]> {
  const rows = await call("GET", "", token);
  return Array.isArray(rows) ? (rows as SummaryRow[]).map(toSummary) : [];
}

export async function getConversation(
  token: string,
  id: string,
): Promise<ConversationDetail> {
  const row = (await call("GET", `/${encodeURIComponent(id)}`, token)) as
    | (SummaryRow & {
        messages?: {
          role: "user" | "assistant";
          content: string;
          urgent?: boolean;
          sources?: AssistantSource[];
          created_at?: string | null;
        }[];
      })
    | null;
  if (!row) throw new AssistantApiError(UNAVAILABLE);
  return {
    ...toSummary(row),
    messages: (row.messages ?? []).map((message) => ({
      role: message.role,
      content: message.content,
      urgent: Boolean(message.urgent),
      sources: Array.isArray(message.sources) ? message.sources : [],
      createdAt: message.created_at ?? null,
    })),
  };
}

export async function deleteConversation(
  token: string,
  id: string,
): Promise<void> {
  await call("DELETE", `/${encodeURIComponent(id)}`, token);
}

export async function deleteAllConversations(token: string): Promise<void> {
  await call("DELETE", "", token);
}

import {
  createContext,
  PropsWithChildren,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  askAssistant,
  AssistantApiError,
  AssistantSource,
  isAssistantConfigured,
} from "@/services/assistantApi";
import { getConversation } from "@/services/historyApi";
import { useAuth } from "@/hooks/useAuth";

export type ChatReply = {
  text: string;
  urgent?: boolean;
  sources?: AssistantSource[];
  error?: boolean;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  reply?: ChatReply;
  time: string;
};

type PrototypeContext = {
  messages: ChatMessage[];
  send: (question: string) => void;
  busy: boolean;
  clearChat: () => void;
  /** The saved conversation on screen, when signed in and it has been saved. */
  conversationId: string | null;
  /** True when a signed-in user's latest exchange could not be saved. */
  unsaved: boolean;
  /** Load a saved conversation into the chat. Throws AssistantApiError. */
  openConversation: (id: string) => Promise<void>;
  completed: string[];
  toggleTask: (id: string) => void;
  largerText: boolean;
  setLargerText: (value: boolean) => void;
  reminders: boolean;
  setReminders: (value: boolean) => void;
  assistantOnline: boolean;
};

const Context = createContext<PrototypeContext | null>(null);

function clock() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function savedTime(createdAt: string | null) {
  const date = createdAt ? new Date(createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PrototypeProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [largerText, setLargerText] = useState(false);
  const [reminders, setReminders] = useState(false);
  const nextId = useRef(0);
  const sending = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  // Keep the latest transcript for the request without racing setState.
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const conversationRef = useRef<string | null>(null);
  conversationRef.current = conversationId;

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  // The chat on screen belongs to whoever was using the app when it was
  // written. When someone signs in or out, start clean so one person's
  // conversation is never left on screen, or saved, under another.
  const owner = auth.status === "ready" ? auth.userId : null;
  useEffect(() => {
    clearChat();
  }, [owner]);

  async function send(question: string) {
    const text = question.trim().slice(0, 1000);
    if (!text || sending.current) return;

    sending.current = true;
    const time = clock();
    const userMessage: ChatMessage = {
      id: nextId.current++,
      role: "user",
      text,
      time,
    };
    const history = [...messagesRef.current, userMessage];
    setMessages(history);
    setBusy(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Null for guests and for accounts that have not finished two-factor.
      const token = await auth.getAccessToken();
      if (controller.signal.aborted) return;
      const reply = await askAssistant(
        history.map((message) => ({
          role: message.role,
          content: message.text,
        })),
        {
          signal: controller.signal,
          token,
          conversationId: conversationRef.current,
        },
      );
      if (controller.signal.aborted) return;
      if (token) {
        if (reply.conversationId) setConversationId(reply.conversationId);
        setUnsaved(!reply.saved);
      }
      setMessages((previous) => [
        ...previous,
        {
          id: nextId.current++,
          role: "assistant",
          text: reply.text,
          reply: {
            text: reply.text,
            urgent: reply.urgent,
            sources: reply.sources,
          },
          time: clock(),
        },
      ]);
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof AssistantApiError
          ? error.message
          : "Something went wrong. Please try again.";
      setMessages((previous) => [
        ...previous,
        {
          id: nextId.current++,
          role: "assistant",
          text: message,
          reply: { text: message, error: true },
          time: clock(),
        },
      ]);
    } finally {
      if (!controller.signal.aborted) {
        setBusy(false);
        sending.current = false;
      }
    }
  }

  function clearChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setConversationId(null);
    setUnsaved(false);
    setBusy(false);
    sending.current = false;
  }

  async function openConversation(id: string) {
    const token = await auth.getAccessToken();
    if (!token) {
      throw new AssistantApiError("Please sign in to open saved conversations.");
    }
    const conversation = await getConversation(token, id);
    clearChat();
    setMessages(
      conversation.messages.map((message) => ({
        id: nextId.current++,
        role: message.role,
        text: message.content,
        reply:
          message.role === "assistant"
            ? {
                text: message.content,
                urgent: message.urgent,
                sources: message.sources,
              }
            : undefined,
        time: savedTime(message.createdAt),
      })),
    );
    setConversationId(conversation.id);
  }

  function toggleTask(id: string) {
    setCompleted((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  return (
    <Context.Provider
      value={{
        messages,
        send,
        busy,
        clearChat,
        conversationId,
        unsaved,
        openConversation,
        completed,
        toggleTask,
        largerText,
        setLargerText,
        reminders,
        setReminders,
        assistantOnline: isAssistantConfigured(),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useTextPreference() {
  return useContext(Context)?.largerText ?? false;
}

export function usePrototype() {
  const value = useContext(Context);
  if (!value) throw new Error("PrototypeProvider is required");
  return value;
}

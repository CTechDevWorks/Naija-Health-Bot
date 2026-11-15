import {
  createContext,
  PropsWithChildren,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { DemoReply, getDemoReply } from "@/services/demoAssistant";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  reply?: DemoReply;
  time: string;
};
type PrototypeContext = {
  state: string;
  setState: (state: string) => void;
  messages: ChatMessage[];
  send: (question: string) => void;
  busy: boolean;
  clearChat: () => void;
  completed: string[];
  toggleTask: (id: string) => void;
  largerText: boolean;
  setLargerText: (value: boolean) => void;
  reminders: boolean;
  setReminders: (value: boolean) => void;
};
const Context = createContext<PrototypeContext | null>(null);
export function PrototypeProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState("Lagos");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [largerText, setLargerText] = useState(false);
  const [reminders, setReminders] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);
  const sending = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function send(question: string) {
    const text = question.trim().slice(0, 1000);
    if (!text || sending.current) return;
    sending.current = true;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((previous) => [
      ...previous,
      { id: nextId.current++, role: "user", text, time },
    ]);
    setBusy(true);
    timer.current = setTimeout(() => {
      const reply = getDemoReply(text);
      setMessages((previous) => [
        ...previous,
        {
          id: nextId.current++,
          role: "assistant",
          text: reply.text,
          reply,
          time,
        },
      ]);
      setBusy(false);
      sending.current = false;
    }, 850);
  }
  function clearChat() {
    if (timer.current) clearTimeout(timer.current);
    setMessages([]);
    setBusy(false);
    sending.current = false;
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
        state,
        setState,
        messages,
        send,
        busy,
        clearChat,
        completed,
        toggleTask,
        largerText,
        setLargerText,
        reminders,
        setReminders,
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

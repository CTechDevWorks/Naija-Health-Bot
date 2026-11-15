import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText, Button, Card, IconButton, ui } from "./healthUi";
import { HealthIcon } from "./healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { useAuth } from "@/hooks/useAuth";
import { usePrototype } from "@/hooks/usePrototype";
import { AssistantApiError } from "@/services/assistantApi";
import {
  ConversationSummary,
  deleteAllConversations,
  deleteConversation,
  listConversations,
} from "@/services/historyApi";

function when(updatedAt: string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reason(error: unknown) {
  return error instanceof AssistantApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * The signed-in user's saved conversations: open one, delete one, delete all.
 * `onOpened` runs after a conversation has been loaded into the chat.
 */
export function SavedConversations({ onOpened }: { onOpened: () => void }) {
  const auth = useAuth();
  const { conversationId, openConversation, clearChat } = usePrototype();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [problem, setProblem] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function withToken<T>(run: (token: string) => Promise<T>): Promise<T> {
    const token = await auth.getAccessToken();
    if (!token) {
      throw new AssistantApiError("Please sign in to see saved conversations.");
    }
    return run(token);
  }

  useEffect(() => {
    let cancelled = false;
    withToken(listConversations).then(
      (rows) => {
        if (!cancelled) setItems(rows);
      },
      (error) => {
        if (cancelled) return;
        setItems([]);
        setProblem(reason(error));
      },
    );
    return () => {
      cancelled = true;
    };
    // Loads once each time the list is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function open(id: string) {
    setProblem("");
    setWorking(id);
    try {
      await openConversation(id);
      onOpened();
    } catch (error) {
      setProblem(reason(error));
    } finally {
      setWorking(null);
    }
  }

  async function remove(id: string) {
    setProblem("");
    setWorking(id);
    try {
      await withToken((token) => deleteConversation(token, id));
      setItems((previous) => (previous ?? []).filter((item) => item.id !== id));
      if (id === conversationId) clearChat();
    } catch (error) {
      setProblem(reason(error));
    } finally {
      setWorking(null);
      setConfirming(null);
    }
  }

  async function removeAll() {
    setProblem("");
    setWorking("all");
    try {
      await withToken(deleteAllConversations);
      setItems([]);
      clearChat();
    } catch (error) {
      setProblem(reason(error));
    } finally {
      setWorking(null);
      setConfirming(null);
    }
  }

  if (items === null) {
    return <ActivityIndicator color={palette.forest} />;
  }

  return (
    <>
      {!!problem && (
        <AppText accessibilityRole="alert" variant="small">
          {problem}
        </AppText>
      )}
      {items.length === 0 && !problem && (
        <Card>
          <HealthIcon name="chat" />
          <AppText variant="heading">Nothing saved yet.</AppText>
          <AppText tone="body">
            Conversations you have with the assistant while signed in will
            appear here.
          </AppText>
        </Card>
      )}
      {items.map((item) =>
        confirming === item.id ? (
          <Card key={item.id}>
            <AppText>
              Delete “{item.title}”? This cannot be undone.
            </AppText>
            <Button
              secondary
              loading={working === item.id}
              onPress={() => remove(item.id)}
            >
              Delete conversation
            </Button>
            <Button secondary onPress={() => setConfirming(null)}>
              Keep it
            </Button>
          </Card>
        ) : (
          <View key={item.id} style={styles.item}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open conversation: ${item.title}`}
              disabled={working !== null}
              onPress={() => open(item.id)}
              style={({ pressed }) => [styles.open, pressed && ui.pressed]}
            >
              <AppText variant="button">{item.title}</AppText>
              <AppText variant="caption" tone="body">
                {when(item.updatedAt)}
                {item.id === conversationId ? " · Open now" : ""}
              </AppText>
            </Pressable>
            {working === item.id ? (
              <ActivityIndicator color={palette.forest} />
            ) : (
              <IconButton
                icon="close"
                label={`Delete conversation: ${item.title}`}
                onPress={() => setConfirming(item.id)}
              />
            )}
          </View>
        ),
      )}
      {items.length > 0 &&
        (confirming === "all" ? (
          <Card>
            <AppText>
              Delete all {items.length} saved conversations from your account?
              This cannot be undone.
            </AppText>
            <Button secondary loading={working === "all"} onPress={removeAll}>
              Delete everything
            </Button>
            <Button secondary onPress={() => setConfirming(null)}>
              Keep them
            </Button>
          </Card>
        ) : (
          <Button secondary onPress={() => setConfirming("all")}>
            Delete all saved conversations
          </Button>
        ))}
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: layout.touch,
    paddingLeft: space.lg,
    paddingRight: space.xs,
    paddingVertical: space.sm,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.md,
    backgroundColor: palette.white,
  },
  open: { flex: 1, gap: space.xxs, paddingVertical: space.xs },
});

import { ComponentRef, useCallback, useEffect, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  AppText,
  Button,
  IconButton,
  Sheet,
  SourceLink,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import {
  layout,
  palette,
  radius,
  space,
  typography,
} from "@/constants/designTokens";
import {
  starterPairCount,
  starterPromptsForVisit,
} from "@/constants/healthContent";
import { SavedConversations } from "@/components/savedConversations";
import { useAuth } from "@/hooks/useAuth";
import { usePrototype } from "@/hooks/usePrototype";

export default function AssistantScreen() {
  const {
    messages,
    busy,
    send,
    clearChat,
    assistantOnline,
    unsaved,
    conversationId,
  } = usePrototype();
  const { status } = useAuth();
  const signedIn = status === "ready";
  const canSignIn =
    status === "guest" || status === "enrol" || status === "challenge";
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [starterVisit, setStarterVisit] = useState(0);
  const skipNextStarterCycle = useRef(true);
  const list = useRef<ComponentRef<typeof ScrollView>>(null);

  useFocusEffect(
    useCallback(() => {
      if (skipNextStarterCycle.current) {
        skipNextStarterCycle.current = false;
        return;
      }
      setStarterVisit((v) => (v + 1) % starterPairCount);
    }, []),
  );

  const starterPrompts = starterPromptsForVisit(starterVisit);

  useEffect(() => {
    if (messages.length) list.current?.scrollToEnd({ animated: false });
    else list.current?.scrollTo({ y: 0, animated: false });
  }, [messages.length, busy]);

  function submit() {
    if (draft.trim() && !busy) {
      send(draft);
      setDraft("");
    }
  }

  return (
    <KeyboardAvoidingView
      style={ui.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <HealthIcon name="chat" />
        </View>
        <View style={ui.flex}>
          <AppText variant="heading" tone="forest">
            Assistant
          </AppText>
          <AppText variant="caption" tone="body">
            {assistantOnline
              ? "Malaria information only"
              : "Unavailable right now"}
          </AppText>
        </View>
        {signedIn && (
          <IconButton
            icon="history"
            label="Saved conversations"
            onPress={() => setHistoryOpen(true)}
          />
        )}
        <IconButton
          icon="plus"
          label="Start a new conversation"
          onPress={() => (messages.length ? setConfirm(true) : setDraft(""))}
        />
      </View>
      {canSignIn && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/account")}
          style={({ pressed }) => [styles.signIn, pressed && ui.pressed]}
        >
          <HealthIcon name="lock" size={layout.smallIcon} />
          <AppText variant="caption" tone="forest" style={ui.flex}>
            {status === "guest" ? "Sign in to save chats" : "Finish sign-in to save"}
          </AppText>
          <HealthIcon name="chevron" size={layout.smallIcon} />
        </Pressable>
      )}
      <ScrollView
        ref={list}
        style={ui.flex}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (messages.length) list.current?.scrollToEnd({ animated: false });
        }}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="display" tone="forest" style={styles.center}>
              Ask a malaria question
            </AppText>
            <View style={styles.prompts}>
              {starterPrompts.map((question) => (
                <Pressable
                  accessibilityRole="button"
                  key={question}
                  onPress={() => send(question)}
                  style={({ pressed }) => [
                    styles.prompt,
                    pressed && ui.pressed,
                  ]}
                >
                  <AppText variant="button" tone="forest" style={ui.flex}>
                    {question}
                  </AppText>
                  <HealthIcon name="arrow" size={layout.smallIcon} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <>
            {signedIn && (
              <AppText variant="caption" tone="body" style={styles.center}>
                {unsaved
                  ? "Last reply was not saved"
                  : conversationId
                    ? "Saved"
                    : "Saving…"}
              </AppText>
            )}
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.message,
                  message.role === "user"
                    ? styles.userMessage
                    : styles.botMessage,
                ]}
              >
                {message.reply?.urgent && (
                  <View accessibilityRole="alert" style={styles.escalation}>
                    <HealthIcon name="alert" />
                    <AppText variant="subheading" tone="forest">
                      Seek urgent care
                    </AppText>
                    <AppText>
                      Call 112 in Nigeria or go to the nearest emergency
                      department.
                    </AppText>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    message.role === "user"
                      ? styles.userBubble
                      : styles.botBubble,
                  ]}
                >
                  <AppText>{message.text}</AppText>
                </View>
                {!!message.reply?.sources?.length && (
                  <View style={styles.source}>
                    {message.reply.sources.map((source) => (
                      <SourceLink
                        key={source.id}
                        title={`${source.organisation} · ${source.title}`}
                        url={source.url}
                      />
                    ))}
                  </View>
                )}
                <AppText variant="caption" tone="body">
                  {message.time}
                </AppText>
              </View>
            ))}
            {busy && (
              <View accessibilityLiveRegion="polite" style={styles.typing}>
                <ActivityIndicator size="small" color={palette.forest} />
                <AppText variant="small" tone="body">
                  Thinking…
                </AppText>
              </View>
            )}
          </>
        )}
        <View style={styles.emergencyNote}>
          <HealthIcon name="alert" size={layout.smallIcon} />
          <AppText variant="caption" tone="body" style={ui.flex}>
            Emergency? Call 112 or go to the nearest emergency department.
          </AppText>
        </View>
      </ScrollView>
      <View style={styles.composerArea}>
        <View style={[styles.composer, focused && ui.focused]}>
          <TextInput
            accessibilityLabel="Your health question"
            placeholder="Ask about malaria…"
            placeholderTextColor={palette.body}
            value={draft}
            onChangeText={setDraft}
            maxLength={1000}
            multiline
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[typography.body, styles.input]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !draft.trim() || busy }}
            disabled={!draft.trim() || busy}
            onPress={submit}
            style={[styles.send, (!draft.trim() || busy) && ui.disabled]}
          >
            <HealthIcon name="send" />
          </Pressable>
        </View>
      </View>
      <Sheet
        visible={confirm}
        title="Start fresh?"
        onClose={() => setConfirm(false)}
      >
        <AppText tone="body">
          {signedIn
            ? "Start a new conversation. The current one stays in your saved list."
            : "Clear this session’s messages."}
        </AppText>
        <Button
          onPress={() => {
            clearChat();
            setConfirm(false);
          }}
        >
          New conversation
        </Button>
        <Button secondary onPress={() => setConfirm(false)}>
          Keep chatting
        </Button>
      </Sheet>
      <Sheet
        visible={historyOpen}
        title="Saved conversations"
        onClose={() => setHistoryOpen(false)}
      >
        {historyOpen && (
          <SavedConversations onOpened={() => setHistoryOpen(false)} />
        )}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "center",
    padding: space.lg,
    paddingTop: space.xl,
  },
  headerIcon: {
    width: layout.avatar,
    height: layout.avatar,
    backgroundColor: palette.softGreen,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  signIn: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: layout.touch,
    paddingHorizontal: space.md,
    marginHorizontal: space.lg,
    marginTop: space.sm,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.sm,
  },
  messages: { padding: space.lg, gap: space.xl, flexGrow: 1 },
  empty: { alignItems: "center", gap: space.lg, paddingTop: space.xl },
  center: { textAlign: "center" },
  prompts: { width: "100%", gap: space.sm, marginTop: space.md },
  prompt: {
    flexDirection: "row",
    minHeight: layout.touch,
    padding: space.lg,
    gap: space.md,
    alignItems: "center",
    borderWidth: layout.line,
    borderColor: palette.line,
    backgroundColor: palette.white,
    borderRadius: radius.md,
  },
  message: { gap: space.sm },
  userMessage: { alignItems: "flex-end" },
  botMessage: { alignItems: "flex-start" },
  bubble: { borderRadius: radius.lg, padding: space.lg, maxWidth: "90%" },
  userBubble: {
    backgroundColor: palette.primary,
    borderBottomRightRadius: radius.xs,
  },
  botBubble: {
    backgroundColor: palette.white,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderBottomLeftRadius: radius.xs,
  },
  source: { paddingHorizontal: space.sm, maxWidth: "90%" },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.sm,
  },
  escalation: {
    padding: space.lg,
    gap: space.md,
    borderWidth: space.xxs,
    borderColor: palette.forest,
    borderRadius: radius.lg,
    backgroundColor: palette.cream,
    width: "100%",
  },
  emergencyNote: {
    flexDirection: "row",
    gap: space.sm,
    marginTop: "auto",
    paddingTop: space.lg,
  },
  composerArea: {
    padding: space.lg,
    paddingTop: space.md,
    gap: space.sm,
    borderTopWidth: layout.line,
    borderColor: palette.line,
    backgroundColor: palette.canvas,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: space.xs,
    paddingLeft: space.lg,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
  },
  input: {
    flex: 1,
    paddingVertical: space.md,
    maxHeight: layout.heroIcon,
    minHeight: layout.touch,
  },
  send: {
    width: layout.touch,
    height: layout.touch,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
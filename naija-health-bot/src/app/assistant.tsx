import { ComponentRef, useEffect, useRef, useState } from "react";
import { router } from "expo-router";
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
  Badge,
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
import { starters } from "@/constants/healthContent";
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
  // Sign-in is offered, but this person is a guest or part-way through it.
  const canSignIn =
    status === "guest" || status === "enrol" || status === "challenge";
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const list = useRef<ComponentRef<typeof ScrollView>>(null);
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
            Your health companion
          </AppText>
          <AppText variant="caption" tone="body">
            A safe space for everyday questions
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
      <View style={styles.scope}>
        <HealthIcon name="info" size={layout.smallIcon} />
        <AppText variant="caption" tone="body" style={ui.flex}>
          {assistantOnline
            ? "Live assistant · Malaria information only, never a diagnosis."
            : "Assistant offline · Set EXPO_PUBLIC_API_BASE_URL and restart Expo."}
        </AppText>
      </View>
      {canSignIn && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/account")}
          style={({ pressed }) => [styles.signIn, pressed && ui.pressed]}
        >
          <HealthIcon name="lock" size={layout.smallIcon} />
          <AppText variant="caption" tone="forest" style={ui.flex}>
            {status === "guest"
              ? "Sign in to save your conversations. Optional."
              : "Finish two-factor sign-in to save your conversations."}
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
            <View style={styles.heroIcon}>
              <HealthIcon name="chat" size={space.xxl} />
            </View>
            <Badge>LET’S MAKE HEALTH A LITTLE CLEARER</Badge>
            <AppText variant="display" tone="forest" style={styles.center}>
              What’s on{"\n"}your mind?
            </AppText>
            <AppText tone="body" style={styles.center}>
              Questions about prevention, symptoms or testing? Start here. Your
              wellbeing matters.
            </AppText>
            <View style={styles.prompts}>
              {starters.map((question) => (
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
            <AppText variant="caption" tone="body" style={styles.center}>
              {!signedIn
                ? "This session · Conversations are not saved"
                : unsaved
                  ? "The latest reply could not be saved to your account"
                  : conversationId
                    ? "Saved to your account"
                    : "Signed in · This conversation will be saved"}
            </AppText>
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
                      Please seek urgent care
                    </AppText>
                    <AppText>
                      Call 112 in Nigeria or go to the nearest emergency
                      department. Do not wait for this chat.
                    </AppText>
                  </View>
                )}
                {message.role === "assistant" && (
                  <View style={ui.row}>
                    <HealthIcon name="sparkle" size={layout.smallIcon} />
                    <AppText variant="label" tone="forest">
                      {message.reply?.error
                        ? "9ja Health · Couldn’t answer"
                        : "9ja Health · Assistant"}
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
                    <AppText variant="caption" tone="body">
                      Linked sources for further reading · not a live check of
                      this answer
                    </AppText>
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
            Severe or worrying symptoms? Seek medical care. For an emergency in
            Nigeria, call 112 or go to the nearest emergency department.
          </AppText>
        </View>
      </ScrollView>
      <View style={styles.composerArea}>
        <View style={[styles.composer, focused && ui.focused]}>
          <TextInput
            accessibilityLabel="Your health question"
            placeholder="Ask a health question…"
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
        <AppText variant="caption" tone="body" style={styles.center}>
          Not a diagnosis or a replacement for a health professional. Avoid
          sharing personal details.
        </AppText>
      </View>
      <Sheet
        visible={confirm}
        title="Start fresh?"
        onClose={() => setConfirm(false)}
      >
        <AppText tone="body">
          {signedIn
            ? "This starts a new conversation. The current one stays in your saved conversations."
            : "This will clear your current conversation. Messages are only held in this session and cannot be recovered."}
        </AppText>
        <Button
          onPress={() => {
            clearChat();
            setConfirm(false);
          }}
        >
          Start a new conversation
        </Button>
        <Button secondary onPress={() => setConfirm(false)}>
          Keep this conversation
        </Button>
      </Sheet>
      <Sheet
        visible={historyOpen}
        title="Saved conversations"
        onClose={() => setHistoryOpen(false)}
      >
        {/* Mounted only while open, so the list is fresh each time. */}
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
  scope: {
    backgroundColor: palette.cream,
    flexDirection: "row",
    padding: space.md,
    marginHorizontal: space.lg,
    gap: space.sm,
    alignItems: "center",
    borderRadius: radius.sm,
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
  heroIcon: {
    width: layout.heroIcon,
    height: layout.heroIcon,
    borderRadius: radius.xl,
    backgroundColor: palette.softGreen,
    justifyContent: "center",
    alignItems: "center",
  },
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

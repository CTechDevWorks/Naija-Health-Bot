import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Switch, View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  Disclaimer,
  RowLink,
  Screen,
  SectionHeading,
  Sheet,
  SourceLink,
  ui,
} from "@/components/healthUi";
import { LocationPicker } from "@/components/locationPicker";
import { HealthIcon } from "@/components/healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { sources } from "@/constants/healthContent";
import { SavedConversations } from "@/components/savedConversations";
import { useAuth } from "@/hooks/useAuth";
import { useEnvironment } from "@/hooks/useEnvironment";
import { usePrototype } from "@/hooks/usePrototype";
import { useUpdatePush } from "@/hooks/useUpdatePush";

type Panel =
  "history" | "privacy" | "support" | "about" | "notifications" | null;
const panelTitles = {
  history: "Your conversations",
  privacy: "Your privacy matters",
  support: "A little help",
  about: "About 9ja Health",
  notifications: "Notification settings",
};
export default function ProfileScreen() {
  const {
    messages,
    largerText,
    setLargerText,
    reminders,
    setReminders,
    clearChat,
  } = usePrototype();
  const {
    enabled: updateAlerts,
    busy: updateAlertsBusy,
    error: updateAlertsError,
    setUpdateAlerts,
  } = useUpdatePush();
  const { state, source } = useEnvironment();
  const { status, email } = useAuth();
  const signedIn = status === "ready";
  const [panel, setPanel] = useState<Panel>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const questions = messages.filter((message) => message.role === "user");
  return (
    <>
      <Screen back>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            {signedIn && email ? (
              <AppText variant="title" tone="forest">
                {email.charAt(0).toUpperCase()}
              </AppText>
            ) : (
              <HealthIcon name="person" size={space.xxl} />
            )}
          </View>
          <AppText
            variant={signedIn ? "subheading" : "heading"}
            tone="forest"
            style={styles.center}
          >
            {signedIn ? email : "Guest"}
          </AppText>
          {signedIn && (
            <View style={styles.centered}>
              <Badge>SIGNED IN · TWO-FACTOR ON</Badge>
            </View>
          )}
          <View style={ui.row}>
            <HealthIcon name="pin" size={layout.smallIcon} />
            <AppText variant="small" tone="body">
              {state
                ? `${state}, Nigeria · ${source === "gps" ? "GPS" : source === "manual" ? "Manual" : "Location"}`
                : "Choose your Nigerian state"}
            </AppText>
          </View>
          <AppText variant="small" tone="body" style={styles.center}>
            {signedIn
              ? "Your conversations with the assistant are saved to this account."
              : status === "enrol" || status === "challenge"
                ? "Sign-in is not finished. Complete the two-factor step to save conversations."
                : "No account needed. Just a little care for everyday life."}
          </AppText>
          {status !== "disabled" && status !== "loading" && (
            <Button
              secondary={signedIn}
              icon="lock"
              onPress={() => router.push("/account")}
            >
              {signedIn
                ? "Manage account"
                : status === "guest"
                  ? "Sign in or create an account"
                  : "Finish signing in"}
            </Button>
          )}
        </Card>
        <View style={ui.smallStack}>
          <SectionHeading title="Your companion" />
          <Card>
            <RowLink
              icon="history"
              title="Conversation history"
              subtitle={
                signedIn
                  ? "Saved to your account"
                  : `${questions.length} question${questions.length === 1 ? "" : "s"} in this session`
              }
              onPress={() => setPanel("history")}
            />
          </Card>
        </View>
        <View style={ui.smallStack}>
          <SectionHeading title="Make yourself comfortable" />
          <Card>
            <RowLink
              icon="pin"
              title="Your location"
              subtitle={`${state} · Change state`}
              onPress={() => setLocationOpen(true)}
            />
            <View style={ui.separator} />
            <RowLink
              icon="book"
              title="Larger text"
              subtitle="15% larger across the prototype"
              trailing={
                <Switch
                  accessibilityLabel="Larger text"
                  value={largerText}
                  onValueChange={setLargerText}
                  trackColor={{ false: palette.line, true: palette.primary }}
                  thumbColor={palette.white}
                />
              }
            />
            <View style={ui.separator} />
            <RowLink
              icon="sun"
              title="Appearance"
              subtitle="Light mode · Inter typography"
              trailing={<Badge>LIGHT</Badge>}
            />
            <View style={ui.separator} />
            <RowLink
              icon="bell"
              title="Notifications & reminders"
              subtitle={
                updateAlerts
                  ? "New health-update alerts on"
                  : reminders
                    ? "In-app prevention reminder on"
                    : "Alerts off"
              }
              onPress={() => setPanel("notifications")}
            />
          </Card>
          <AppText variant="caption" tone="body">
            Health-update alerts stay on across launches. Other preferences are
            session-only.
          </AppText>
        </View>
        <View style={ui.smallStack}>
          <SectionHeading title="Here to help" />
          <Card>
            <RowLink
              icon="lock"
              title="Privacy & your data"
              onPress={() => setPanel("privacy")}
            />
            <View style={ui.separator} />
            <RowLink
              icon="help"
              title="Support & safety"
              onPress={() => setPanel("support")}
            />
            <View style={ui.separator} />
            <RowLink
              icon="info"
              title="About 9ja Health"
              subtitle="Understand your environment. Stay informed."
              onPress={() => setPanel("about")}
            />
          </Card>
        </View>
        <Disclaimer />
        <AppText variant="caption" tone="body" style={styles.center}>
          9ja Health · UI prototype 1.0.0{"\n"}Built with care for Nigeria.
        </AppText>
      </Screen>
      <LocationPicker
        visible={locationOpen}
        onClose={() => setLocationOpen(false)}
      />
      <Sheet
        visible={!!panel}
        title={panel ? panelTitles[panel] : ""}
        onClose={() => {
          setPanel(null);
          setClearConfirm(false);
        }}
      >
        {panel === "history" && signedIn && (
          <SavedConversations
            onOpened={() => {
              setPanel(null);
              router.push("/assistant");
            }}
          />
        )}
        {panel === "history" && !signedIn && (
          <>
            <AppText tone="body">
              {status === "disabled"
                ? "Only this open session is available. Nothing is saved to an account or database."
                : "You are not signed in, so only this open session is available and nothing is saved. Sign in to keep your conversations."}
            </AppText>
            {questions.length === 0 ? (
              <Card>
                <HealthIcon name="chat" />
                <AppText variant="heading">A fresh start.</AppText>
                <AppText tone="body">
                  Your questions will appear here after you start a
                  conversation.
                </AppText>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id}>
                  <AppText variant="button">{question.text}</AppText>
                  <AppText variant="caption" tone="body">
                    {question.time} · This session
                  </AppText>
                </Card>
              ))
            )}
            <Button
              icon="chat"
              onPress={() => {
                setPanel(null);
                router.push("/assistant");
              }}
            >
              {questions.length
                ? "Continue conversation"
                : "Start a conversation"}
            </Button>
            {questions.length > 0 &&
              (clearConfirm ? (
                <Card>
                  <AppText>
                    Clear every message in this session? This cannot be undone.
                  </AppText>
                  <Button
                    secondary
                    onPress={() => {
                      clearChat();
                      setClearConfirm(false);
                    }}
                  >
                    Confirm clear conversation
                  </Button>
                  <Button secondary onPress={() => setClearConfirm(false)}>
                    Keep conversation
                  </Button>
                </Card>
              ) : (
                <Button secondary onPress={() => setClearConfirm(true)}>
                  Clear conversation
                </Button>
              ))}
          </>
        )}
        {panel === "privacy" && (
          <>
            <HealthIcon name="lock" />
            <AppText variant="heading" tone="forest">
              Less data. More peace of mind.
            </AppText>
            <AppText>
              9ja Health does not request GPS. Checklist steps and preferences
              stay in memory on this device and disappear on reload.
            </AppText>
            <AppText>
              Questions you ask the assistant are sent to the 9ja Health server
              and on to an AI provider to write the answer.
            </AppText>
            <AppText>
              {status === "disabled"
                ? "There are no accounts in this build, so conversations are not saved anywhere after the session ends."
                : "An account is optional. Without one, conversations are not saved after the session ends. If you sign in, we keep your email address and your conversations with the assistant, as plain text, so you can read them again. You can delete any conversation, or all of them, from the saved conversations list."}
            </AppText>
            <AppText>
              Do not share names, contact details or private medical records in
              chat. Source links open third-party websites with their own
              privacy policies.
            </AppText>
            <AppText variant="small" tone="body">
              This is a prototype. Its data handling has not had a formal
              privacy review.
            </AppText>
          </>
        )}
        {panel === "notifications" && (
          <>
            <AppText variant="heading" tone="forest">
              A gentle nudge, on your terms.
            </AppText>
            <AppText tone="body">
              Turn on health-update alerts to be notified when a new official
              report is published. You can also keep a prevention reminder card
              on Home for this session.
            </AppText>
            <Card>
              <RowLink
                icon="news"
                title="New health updates"
                subtitle={
                  updateAlertsBusy
                    ? "Updating…"
                    : "Push when a report is published"
                }
                trailing={
                  <Switch
                    accessibilityLabel="New health update notifications"
                    value={updateAlerts}
                    disabled={updateAlertsBusy}
                    onValueChange={(value) => void setUpdateAlerts(value)}
                    trackColor={{ false: palette.line, true: palette.primary }}
                    thumbColor={palette.white}
                  />
                }
              />
              <View style={ui.separator} />
              <RowLink
                icon="bell"
                title="In-app prevention reminder"
                subtitle="Show a helpful card on Home"
                trailing={
                  <Switch
                    accessibilityLabel="In-app prevention reminder"
                    value={reminders}
                    onValueChange={setReminders}
                    trackColor={{ false: palette.line, true: palette.primary }}
                    thumbColor={palette.white}
                  />
                }
              />
            </Card>
            {updateAlertsError ? (
              <AppText variant="small" tone="body">
                {updateAlertsError}
              </AppText>
            ) : null}
            <Button
              secondary
              onPress={() => {
                setPanel(null);
                router.replace("/");
              }}
            >
              View Home
            </Button>
          </>
        )}
        {panel === "support" && (
          <>
            <AppText variant="heading" tone="forest">
              For information, not emergencies.
            </AppText>
            <AppText>
              If you have severe or worrying symptoms, seek medical care. For an
              emergency in Nigeria, call 112 or go to the nearest emergency
              department. This app cannot contact or dispatch emergency
              services.
            </AppText>
            <AppText tone="body">
              For an individual health concern, a qualified health professional
              is the right person to help. A product support contact has not
              been configured in this prototype.
            </AppText>
            <SourceLink
              title="Nigeria Centre for Disease Control and Prevention"
              url={sources.ncdc}
            />
          </>
        )}
        {panel === "about" && (
          <>
            <Badge>9JA HEALTH · PROTOTYPE</Badge>
            <AppText variant="title" tone="forest">
              Good health, grounded in everyday life.
            </AppText>
            <AppText>
              9ja Health is a Nigerian health and environmental intelligence
              mobile-app concept. It connects local context, prevention and
              trusted information — without pretending to be a doctor.
            </AppText>
            <AppText tone="body">
              This frontend uses React Native, Expo SDK 58 and Expo Router. The
              assistant runs on a FastAPI service. ML predictions, live weather,
              and optional push alerts when a new report is published.
            </AppText>
            <SourceLink
              title="Educational source · World Health Organization"
              url={sources.malaria}
            />
            <Disclaimer />
          </>
        )}
      </Sheet>
    </>
  );
}
const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    backgroundColor: palette.cream,
    borderColor: palette.cream,
    paddingVertical: space.xl,
  },
  avatar: {
    width: layout.heroIcon,
    height: layout.heroIcon,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  centered: { alignSelf: "center" },
});

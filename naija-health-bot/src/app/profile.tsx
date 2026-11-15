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
import { usePrototype } from "@/hooks/usePrototype";

type Panel =
  "history" | "privacy" | "support" | "about" | "notifications" | null;
const panelTitles = {
  history: "Your conversation",
  privacy: "Your privacy matters",
  support: "A little help",
  about: "About 9ja Health",
  notifications: "Notification settings",
};
export default function ProfileScreen() {
  const {
    state,
    messages,
    largerText,
    setLargerText,
    reminders,
    setReminders,
    clearChat,
  } = usePrototype();
  const [panel, setPanel] = useState<Panel>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const questions = messages.filter((message) => message.role === "user");
  return (
    <>
      <Screen
        title="A space for you."
        subtitle="Your preferences. Your peace of mind."
        back
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText variant="title" tone="forest">
              A
            </AppText>
          </View>
          <AppText variant="heading" tone="forest">
            Ada Okafor
          </AppText>
          <Badge>FICTIONAL DEMO PROFILE</Badge>
          <View style={ui.row}>
            <HealthIcon name="pin" size={layout.smallIcon} />
            <AppText variant="small" tone="body">
              {state}, Nigeria · Manual selection
            </AppText>
          </View>
          <AppText variant="small" tone="body" style={styles.center}>
            No account needed. Just a little care for everyday life.
          </AppText>
        </Card>
        <View style={ui.smallStack}>
          <SectionHeading title="Your companion" />
          <Card>
            <RowLink
              icon="history"
              title="Conversation history"
              subtitle={`${questions.length} question${questions.length === 1 ? "" : "s"} in this session`}
              onPress={() => setPanel("history")}
            />
            <View style={ui.separator} />
            <RowLink
              icon="book"
              title="Explore health topics"
              subtitle="Learn something good for you"
              onPress={() => router.push("/explore")}
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
                reminders
                  ? "In-app reminder enabled"
                  : "No push notifications enabled"
              }
              onPress={() => setPanel("notifications")}
            />
          </Card>
          <AppText variant="caption" tone="body">
            Preferences apply for this session only and reset on reload.
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
        {panel === "history" && (
          <>
            <AppText tone="body">
              Only this open session is available. Nothing is saved to an
              account or database.
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
              This prototype does not request GPS, create accounts, contact an
              AI provider, or store your conversations. Messages, checklist
              steps and preferences stay in memory and disappear on reload.
            </AppText>
            <AppText>
              Do not share names, contact details or private medical records in
              chat. Source links open third-party websites with their own
              privacy policies.
            </AppText>
            <AppText variant="small" tone="body">
              Future server integrations require their own privacy review before
              release.
            </AppText>
          </>
        )}
        {panel === "notifications" && (
          <>
            <AppText variant="heading" tone="forest">
              A gentle nudge, on your terms.
            </AppText>
            <AppText tone="body">
              Push notifications and scheduled alerts are not implemented. This
              switch only shows a prevention reminder card on Home for the
              current session.
            </AppText>
            <Card>
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
              This frontend uses React Native, Expo SDK 58 and Expo Router. AI,
              FastAPI, ML predictions, live weather, live reports and push
              notifications are not connected.
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
});

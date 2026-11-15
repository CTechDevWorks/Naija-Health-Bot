import { useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import {
  AppText,
  Button,
  Card,
  Disclaimer,
  Screen,
  SectionHeading,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { LocationPicker } from "@/components/locationPicker";
import { OutlookCard } from "@/components/outlookCard";
import { WeatherStrip } from "@/components/weatherStrip";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { useEnvironment } from "@/hooks/useEnvironment";
import { usePrototype } from "@/hooks/usePrototype";

export default function HomeScreen() {
  const { reminders } = usePrototype();
  const { state, placeLabel, status, refreshFromGps } = useEnvironment();
  const [locationOpen, setLocationOpen] = useState(false);
  const locationLabel =
    placeLabel ?? state ?? (status === "loading" ? "Finding you…" : "Choose state");

  return (
    <>
      <Screen>
        <View style={styles.brandRow}>
          <View>
            <AppText variant="heading" tone="forest">
              9ja Health
              <AppText variant="heading" tone="forest">
                .
              </AppText>
            </AppText>
            <AppText variant="eyebrow" tone="body">
              WELLNESS, CLOSER TO HOME
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile and preferences"
            onPress={() => router.push("/profile")}
            style={styles.avatar}
          >
            <AppText variant="subheading" tone="forest">
              •
            </AppText>
          </Pressable>
        </View>
        <View style={styles.welcome}>
          <AppText variant="title" tone="forest">
            {state ? `Hello, ${state}.` : "Hello."}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change location, currently ${locationLabel}`}
            onPress={() => setLocationOpen(true)}
            onLongPress={() => void refreshFromGps()}
            style={styles.location}
          >
            <HealthIcon name="pin" size={layout.smallIcon} />
            <AppText variant="label" tone="forest">
              {locationLabel}
            </AppText>
            <HealthIcon name="down" size={layout.smallIcon} />
          </Pressable>
        </View>
        <OutlookCard />
        <WeatherStrip onChooseState={() => setLocationOpen(true)} />
        <View style={ui.smallStack}>
          <SectionHeading
            title="Prevention"
            action="Open"
            onPress={() => router.push("/prevention")}
          />
          <Card>
            <View style={ui.row}>
              <View style={styles.smallIcon}>
                <HealthIcon name="shield" />
              </View>
              <View style={ui.flex}>
                <AppText variant="subheading">Daily AI report</AppText>
                <AppText variant="small" tone="body">
                  Likelihood and tips for your area.
                </AppText>
              </View>
            </View>
            <Button
              secondary
              icon="right"
              onPress={() => router.push("/prevention")}
            >
              View report
            </Button>
          </Card>
        </View>
        <View style={ui.smallStack}>
          <SectionHeading
            title="Updates"
            action="Open"
            onPress={() => router.push("/updates")}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/updates")}
            style={styles.update}
          >
            <HealthIcon name="news" />
            <View style={ui.flex}>
              <AppText variant="subheading">Today’s briefing</AppText>
              <AppText variant="small" tone="body">
                Health news, summarised daily.
              </AppText>
            </View>
            <HealthIcon name="chevron" size={layout.smallIcon} />
          </Pressable>
        </View>
        <View style={styles.assistantCard}>
          <AppText variant="title" tone="white">
            Ask the assistant
          </AppText>
          <Button icon="right" onPress={() => router.push("/assistant")}>
            Start a conversation
          </Button>
        </View>
        {reminders && (
          <Card soft>
            <View style={ui.row}>
              <HealthIcon name="bell" />
              <AppText variant="subheading">Net check</AppText>
            </View>
            <AppText tone="body">
              Is your insecticide-treated net ready for tonight?
            </AppText>
          </Card>
        )}
        <Disclaimer />
      </Screen>
      <LocationPicker
        visible={locationOpen}
        onClose={() => setLocationOpen(false)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: space.lg,
    borderBottomWidth: layout.line,
    borderColor: palette.line,
  },
  avatar: {
    width: layout.avatar,
    height: layout.avatar,
    borderRadius: radius.pill,
    backgroundColor: palette.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  welcome: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.sm,
  },
  location: {
    minHeight: layout.touch,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  smallIcon: {
    height: layout.featureIcon,
    width: layout.featureIcon,
    backgroundColor: palette.softGreen,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  update: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    padding: space.lg,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.md,
    backgroundColor: palette.white,
  },
  assistantCard: {
    backgroundColor: palette.forest,
    padding: space.xl,
    borderRadius: radius.lg,
    gap: space.lg,
  },
});
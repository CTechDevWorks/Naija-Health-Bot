import { useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  Disclaimer,
  IconButton,
  Screen,
  SectionHeading,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { LocationPicker } from "@/components/locationPicker";
import { OutlookCard } from "@/components/outlookCard";
import { WeatherStrip } from "@/components/weatherStrip";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { starters } from "@/constants/healthContent";
import { usePrototype } from "@/hooks/usePrototype";

export default function HomeScreen() {
  const { state, send, reminders } = usePrototype();
  const [locationOpen, setLocationOpen] = useState(false);
  function ask(question: string) {
    send(question);
    router.push("/assistant");
  }
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
          <View style={ui.row}>
            <IconButton
              icon="book"
              label="Explore health topics"
              onPress={() => router.push("/explore")}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile and preferences"
              onPress={() => router.push("/profile")}
              style={styles.avatar}
            >
              <AppText variant="subheading" tone="forest">
                A
              </AppText>
            </Pressable>
          </View>
        </View>
        <View style={styles.welcome}>
          <View style={ui.smallStack}>
            <AppText variant="small" tone="body">
              A good day to take care of you
            </AppText>
            <AppText variant="title" tone="forest">
              Hello, Ada.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change selected state, currently ${state}`}
            onPress={() => setLocationOpen(true)}
            style={styles.location}
          >
            <HealthIcon name="pin" size={layout.smallIcon} />
            <AppText variant="label" tone="forest">
              {state}
            </AppText>
            <HealthIcon name="down" size={layout.smallIcon} />
          </Pressable>
        </View>
        <AppText variant="caption" tone="body">
          Interactive prototype · Fictional profile · Manual location
        </AppText>
        <OutlookCard />
        <WeatherStrip />
        <View style={ui.smallStack}>
          <SectionHeading
            title="Small steps, big care"
            action="See all"
            onPress={() => router.push("/prevention")}
          />
          <Card>
            <View style={ui.row}>
              <View style={styles.smallIcon}>
                <HealthIcon name="shield" />
              </View>
              <View style={ui.flex}>
                <AppText variant="subheading">Make tonight a net night</AppText>
                <AppText variant="small" tone="body">
                  An everyday habit for mosquito-bite prevention.
                </AppText>
              </View>
            </View>
            <Button
              secondary
              icon="right"
              onPress={() => router.push("/prevention")}
            >
              Explore prevention tips
            </Button>
          </Card>
        </View>
        <View style={ui.smallStack}>
          <SectionHeading
            title="Stay in the know"
            action="Updates"
            onPress={() => router.push("/updates")}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/updates")}
            style={styles.update}
          >
            <HealthIcon name="news" />
            <View style={ui.flex}>
              <AppText variant="subheading">
                Trusted information. Clear sources.
              </AppText>
              <AppText variant="small" tone="body">
                Find Nigerian health authorities and official updates.
              </AppText>
            </View>
            <HealthIcon name="chevron" size={layout.smallIcon} />
          </Pressable>
        </View>
        <View style={styles.assistantCard}>
          <View style={ui.sectionHeading}>
            <View style={styles.assistantIcon}>
              <HealthIcon name="chat" />
            </View>
            <View style={styles.demoBadge}>
              <AppText variant="eyebrow" tone="forest">
                MEET YOUR COMPANION
              </AppText>
            </View>
          </View>
          <AppText variant="title" tone="white">
            Health questions?{"\n"}Let’s talk.
          </AppText>
          <AppText tone="white">
            A little clarity can go a long way. Explore simple, source-backed
            health information.
          </AppText>
          <Button icon="right" onPress={() => router.push("/assistant")}>
            Start a conversation
          </Button>
          <AppText variant="caption" tone="white">
            Prepared demo answers · Not a connected AI service
          </AppText>
        </View>
        <View style={ui.smallStack}>
          <SectionHeading title="A good place to start" />
          {starters.slice(0, 3).map((question) => (
            <Pressable
              accessibilityRole="button"
              key={question}
              style={styles.question}
              onPress={() => ask(question)}
            >
              <AppText variant="button" tone="forest" style={ui.flex}>
                {question}
              </AppText>
              <HealthIcon name="arrow" size={layout.smallIcon} />
            </Pressable>
          ))}
        </View>
        <Card soft>
          <Badge>A LITTLE LEARNING, EVERY DAY</Badge>
          <AppText variant="heading" tone="forest">
            Good health starts with understanding.
          </AppText>
          <AppText variant="small" tone="body">
            Nutrition, everyday wellness and prevention — in plain language.
          </AppText>
          <Button secondary icon="book" onPress={() => router.push("/explore")}>
            Explore health topics
          </Button>
        </Card>
        {reminders && (
          <Card soft>
            <View style={ui.row}>
              <HealthIcon name="bell" />
              <AppText variant="subheading">Your in-app reminder</AppText>
            </View>
            <AppText tone="body">
              A quick check before bed: is your insecticide-treated net ready
              for tonight?
            </AppText>
            <AppText variant="caption" tone="body">
              Shown because you enabled the session-only reminder in Profile. No
              push notification is sent.
            </AppText>
          </Card>
        )}
        <Disclaimer />
        <View style={styles.footer}>
          <HealthIcon name="heart" size={layout.smallIcon} />
          <AppText variant="caption" tone="body">
            Made with care, for everyday life in Nigeria.
          </AppText>
        </View>
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
  assistantIcon: {
    width: layout.featureIcon,
    height: layout.featureIcon,
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  demoBadge: {
    backgroundColor: palette.cream,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  question: {
    borderWidth: layout.line,
    borderColor: palette.line,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    flexDirection: "row",
    padding: space.lg,
    minHeight: layout.touch,
    alignItems: "center",
    gap: space.md,
  },
  footer: {
    flexDirection: "row",
    gap: space.sm,
    justifyContent: "center",
    paddingVertical: space.sm,
    alignItems: "center",
  },
});

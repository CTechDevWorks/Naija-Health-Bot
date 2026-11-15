import { StyleSheet, View, Pressable } from "react-native";
import { router } from "expo-router";

import { layout, palette, radius, space } from "@/constants/designTokens";
import { useEnvironment } from "@/hooks/useEnvironment";
import { AppText, Badge, ui } from "./healthUi";
import { HealthIcon } from "./healthIcon";

export function OutlookCard() {
  const { state, weather, source, status } = useEnvironment();
  const area = state ?? "your area";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View the health outlook for ${area}`}
      onPress={() => router.push("/outlook")}
      style={({ pressed }) => [styles.card, pressed && ui.pressed]}
    >
      <View style={ui.sectionHeading}>
        <Badge cream>YOUR LOCAL HEALTH OUTLOOK</Badge>
        <HealthIcon name="outlook" />
      </View>
      <AppText variant="title" tone="forest">
        {weather
          ? `${weather.summary} in ${area}.`
          : status === "loading"
            ? "Checking your area…"
            : `Health context for ${area}.`}
      </AppText>
      <AppText tone="body">
        {weather
          ? `${weather.temperatureC}°C · ${weather.humidityPct}% humidity · ${weather.rainfallMm} mm rain today. Small prevention steps still help.`
          : "Understand your environment and the small steps that help you stay well."}
      </AppText>
      <View style={styles.rule} />
      <View style={ui.sectionHeading}>
        <View style={ui.smallStack}>
          <AppText variant="label" tone="forest">
            {state
              ? `${state} · ${source === "gps" ? "GPS" : source === "manual" ? "Manual" : "Location"}`
              : "Location needed"}
          </AppText>
          <AppText variant="caption" tone="body">
            {weather
              ? "Live weather connected · Area-level malaria outlook coming next"
              : "Live weather will appear once location is ready"}
          </AppText>
        </View>
        <View style={styles.arrow}>
          <HealthIcon name="arrow" size={layout.smallIcon} />
        </View>
      </View>
      <AppText variant="caption" tone="body">
        Area-level information, not your personal risk.
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cream,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.lg,
  },
  rule: { height: layout.line, backgroundColor: palette.forest, opacity: 0.12 },
  arrow: {
    width: layout.avatar,
    height: layout.avatar,
    borderRadius: radius.pill,
    backgroundColor: palette.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
});

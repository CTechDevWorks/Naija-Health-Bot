import { StyleSheet, View, Pressable } from "react-native";
import { router } from "expo-router";

import { useMemo } from "react";

import { layout, palette, radius, space } from "@/constants/designTokens";
import {
  computeInsights,
  getOutlookForState,
} from "@/services/outlookData";
import { useEnvironment } from "@/hooks/useEnvironment";
import { AppText, ui } from "./healthUi";
import { HealthIcon } from "./healthIcon";

export function OutlookCard() {
  const { state } = useEnvironment();
  const area = state ?? "your area";
  const teaser = useMemo(() => {
    const bundle = getOutlookForState(state);
    if (!bundle) return null;
    return computeInsights(bundle.incidence, bundle.national);
  }, [state]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View outlook for ${area}`}
      onPress={() => router.push("/outlook")}
      style={({ pressed }) => [styles.card, pressed && ui.pressed]}
    >
      <View style={ui.sectionHeading}>
        <AppText variant="label" tone="forest">
          Outlook
        </AppText>
        <HealthIcon name="outlook" />
      </View>
      <AppText variant="title" tone="forest">
        {state ? `Trends for ${area}` : "Area trends"}
      </AppText>
      <View style={ui.sectionHeading}>
        <AppText variant="small" tone="body">
          {teaser
            ? `About ${teaser.latest.value.toFixed(0)} cases per 1,000 in ${teaser.latest.year} · see chart`
            : "Long-term patterns for your state"}
        </AppText>
        <View style={styles.arrow}>
          <HealthIcon name="arrow" size={layout.smallIcon} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cream,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.md,
  },
  arrow: {
    width: layout.avatar,
    height: layout.avatar,
    borderRadius: radius.pill,
    backgroundColor: palette.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
});
import { StyleSheet, View, Pressable } from "react-native";
import { router } from "expo-router";

import { layout, palette, radius, space } from "@/constants/designTokens";
import { useEnvironment } from "@/hooks/useEnvironment";
import { AppText, ui } from "./healthUi";
import { HealthIcon } from "./healthIcon";

export function OutlookCard() {
  const { state } = useEnvironment();
  const area = state ?? "your area";

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
          Population patterns over time
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
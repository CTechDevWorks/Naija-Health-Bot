import { StyleSheet, View, Pressable } from "react-native";
import { router } from "expo-router";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { usePrototype } from "@/hooks/usePrototype";
import { AppText, Badge, ui } from "./healthUi";
import { HealthIcon } from "./healthIcon";

export function OutlookCard() {
  const { state } = usePrototype();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View the demo health outlook for ${state}`}
      onPress={() => router.push("/outlook")}
      style={({ pressed }) => [styles.card, pressed && ui.pressed]}
    >
      <View style={ui.sectionHeading}>
        <Badge cream>YOUR LOCAL HEALTH OUTLOOK</Badge>
        <HealthIcon name="outlook" />
      </View>
      <AppText variant="title" tone="forest">
        A little awareness.{"\n"}A healthier everyday.
      </AppText>
      <AppText tone="body">
        Understand your environment and the small steps that help you stay well.
      </AppText>
      <View style={styles.rule} />
      <View style={ui.sectionHeading}>
        <View style={ui.smallStack}>
          <AppText variant="label" tone="forest">
            {state} · Demo preview
          </AppText>
          <AppText variant="caption" tone="body">
            No live area-level estimate available
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

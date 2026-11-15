import { Pressable, StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Card,
  Disclaimer,
  Screen,
  SourceLink,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import {
  contentDate,
  preventionGroups,
  sources,
} from "@/constants/healthContent";
import { usePrototype } from "@/hooks/usePrototype";

export default function PreventionScreen() {
  const { completed, toggleTask } = usePrototype();
  return (
    <Screen
      title="A little care, every day"
      subtitle="Small, practical steps for your wellbeing."
    >
      <Card soft>
        <View style={ui.row}>
          <HealthIcon name="shield" />
          <Badge>PREVENTION, NOT PREDICTION</Badge>
        </View>
        <AppText variant="heading" tone="forest">
          You don’t need a forecast to build good habits.
        </AppText>
        <AppText tone="body">
          Use this gentle checklist to explore general prevention tips. Tick a
          step when you’ve done it — no scores, no pressure.
        </AppText>
        <AppText variant="caption" tone="body">
          Session-only checklist · {completed.length} of 6 steps checked
        </AppText>
      </Card>
      {preventionGroups.map((group) => (
        <View key={group.title} style={ui.stack}>
          <View style={ui.row}>
            <HealthIcon name={group.icon} />
            <AppText variant="heading" tone="forest">
              {group.title}
            </AppText>
          </View>
          {group.items.map((item) => {
            const checked = completed.includes(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggleTask(item.id)}
                style={({ pressed }) => [
                  styles.task,
                  checked && styles.checked,
                  pressed && ui.pressed,
                ]}
              >
                <View
                  style={[styles.checkbox, checked && styles.checkboxChecked]}
                >
                  {checked && (
                    <HealthIcon name="check" size={layout.smallIcon} />
                  )}
                </View>
                <View style={ui.flex}>
                  <AppText
                    variant="subheading"
                    style={checked ? styles.done : undefined}
                  >
                    {item.title}
                  </AppText>
                  <AppText variant="small" tone="body">
                    {item.body}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <SourceLink
        title={`Educational guidance · WHO Malaria · ${contentDate}`}
        url={sources.malaria}
      />
      <AppText variant="caption" tone="body">
        General educational guidance, not personalised medical advice. Checklist
        ticks are not stored after reload.
      </AppText>
      <Disclaimer />
    </Screen>
  );
}
const styles = StyleSheet.create({
  task: {
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.md,
    padding: space.lg,
    backgroundColor: palette.white,
    flexDirection: "row",
    gap: space.lg,
    alignItems: "flex-start",
  },
  checked: { backgroundColor: palette.softGreen },
  checkbox: {
    width: space.xl,
    height: space.xl,
    borderRadius: radius.pill,
    borderWidth: layout.line,
    borderColor: palette.body,
    marginTop: space.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  done: { textDecorationLine: "line-through" },
});

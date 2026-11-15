import { Pressable, StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Card,
  Disclaimer,
  Screen,
  SectionHeading,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { preventionGroups } from "@/constants/healthContent";
import { useEnvironment } from "@/hooks/useEnvironment";
import { usePrototype } from "@/hooks/usePrototype";

export default function PreventionScreen() {
  const { completed, toggleTask } = usePrototype();
  const { state, weather } = useEnvironment();
  const area = state ?? "your area";

  return (
    <Screen title="Prevention" subtitle="Likelihood report and tips">
      <Card soft>
        <Badge>MODEL REPORT</Badge>
        <AppText variant="heading" tone="forest">
          Malaria likelihood · {area}
        </AppText>
        {weather ? (
          <AppText tone="body">
            {weather.summary} · {weather.temperatureC}°C · {weather.humidityPct}%
            humidity · {weather.rainfallMm} mm rain
          </AppText>
        ) : (
          <AppText tone="body">Weather appears once location is set.</AppText>
        )}
        <AppText variant="subheading" tone="forest">
          Report not ready yet
        </AppText>
      </Card>

      <SectionHeading title="Tips" />
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

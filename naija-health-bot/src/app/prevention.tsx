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

/**
 * Prevention is the only screen that will show trained-model outputs:
 * likelihood, category, period, factors, and rule-based tips.
 * Until the Prevention API is live, slots stay empty / placeholder.
 */
export default function PreventionScreen() {
  const { completed, toggleTask } = usePrototype();
  const { state, weather } = useEnvironment();
  const area = state ?? "your area";

  // Wired later from POST /api/v1/prevention — all model fields land here.
  const modelReport = null as null | {
    incidencePer1000: number;
    category: string;
    period: string;
    factors: string[];
    tips: { id: string; title: string; body: string }[];
    modelVersion: string;
    updatedAt: string;
  };

  return (
    <Screen>
      <Card soft>
        <Badge>TRAINED MODEL REPORT</Badge>
        <AppText variant="heading" tone="forest">
          Malaria likelihood · {area}
        </AppText>
        {weather ? (
          <AppText tone="body">
            Weather now: {weather.summary} · {weather.temperatureC}°C ·{" "}
            {weather.humidityPct}% humidity · {weather.rainfallMm} mm rain
          </AppText>
        ) : (
          <AppText tone="body">Weather appears once location is set.</AppText>
        )}

        {modelReport ? (
          <View style={ui.stack}>
            <View style={ui.smallStack}>
              <AppText variant="label" tone="body">
                Estimated incidence
              </AppText>
              <AppText variant="title" tone="forest">
                {modelReport.incidencePer1000} per 1,000 · {modelReport.category}
              </AppText>
              <AppText variant="caption" tone="body">
                Period: {modelReport.period} · Model {modelReport.modelVersion} ·
                Updated {modelReport.updatedAt}
              </AppText>
            </View>
            {modelReport.factors.length > 0 ? (
              <View style={ui.smallStack}>
                <AppText variant="label" tone="body">
                  Factors in this estimate
                </AppText>
                {modelReport.factors.map((factor) => (
                  <AppText key={factor} tone="body">
                    · {factor}
                  </AppText>
                ))}
              </View>
            ) : null}
            <AppText variant="caption" tone="body">
              Area-level estimate only — not your personal chance of illness,
              and not a diagnosis.
            </AppText>
          </View>
        ) : (
          <View style={ui.smallStack}>
            <AppText variant="subheading" tone="forest">
              Report not ready yet
            </AppText>
            <AppText variant="small" tone="body">
              When the Prevention API is connected, this card shows the model’s
              incidence estimate, category, period, factors, and tips for{" "}
              {area}.
            </AppText>
          </View>
        )}
      </Card>

      <SectionHeading title="Tips from your report" />
      {modelReport?.tips?.length ? (
        modelReport.tips.map((item) => (
          <Card key={item.id}>
            <AppText variant="subheading">{item.title}</AppText>
            <AppText variant="small" tone="body">
              {item.body}
            </AppText>
          </Card>
        ))
      ) : (
        <>
          <AppText variant="small" tone="body">
            Model-driven tips appear here once the report is live. Until then,
            use these general steps:
          </AppText>
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
                      style={[
                        styles.checkbox,
                        checked && styles.checkboxChecked,
                      ]}
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
        </>
      )}

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

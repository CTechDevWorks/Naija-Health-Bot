import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
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
import {
  fetchPreventionReport,
  isPreventionConfigured,
  PreventionApiError,
  type PreventionReport,
} from "@/services/preventionApi";

/**
 * Prevention is the only screen that shows trained-model outputs:
 * likelihood, category, period, factors, and rule-based tips.
 */
export default function PreventionScreen() {
  const { completed, toggleTask } = usePrototype();
  const { state, weather, coords } = useEnvironment();
  const area = state ?? "your area";

  const [modelReport, setModelReport] = useState<PreventionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!state || !coords) {
      setModelReport(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (!isPreventionConfigured()) {
      setModelReport(null);
      setError(
        "Set EXPO_PUBLIC_API_BASE_URL and restart Expo to load the model report.",
      );
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const report = await fetchPreventionReport({
          latitude: coords.latitude,
          longitude: coords.longitude,
          state,
          signal: controller.signal,
        });
        if (id !== requestId.current) return;
        setModelReport(report);
      } catch (err) {
        if (controller.signal.aborted || id !== requestId.current) return;
        const message =
          err instanceof PreventionApiError
            ? err.message
            : "The Prevention report could not be loaded.";
        setModelReport(null);
        setError(message);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [state, coords?.latitude, coords?.longitude]);

  const updatedLabel = modelReport
    ? new Date(modelReport.updatedAt).toLocaleString()
    : null;

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

        {loading ? (
          <View style={ui.smallStack}>
            <ActivityIndicator color={palette.primary} />
            <AppText variant="small" tone="body">
              Estimating area-level incidence for {area}…
            </AppText>
          </View>
        ) : modelReport ? (
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
                Updated {updatedLabel}
              </AppText>
            </View>
            {modelReport.factors.length > 0 ? (
              <View style={ui.smallStack}>
                <AppText variant="label" tone="body">
                  Factors in this estimate
                </AppText>
                {modelReport.factors.map((factor) => (
                  <AppText key={factor.label} tone="body">
                    · {factor.label}: {factor.detail}
                  </AppText>
                ))}
              </View>
            ) : null}
            {modelReport.limitations.length > 0 ? (
              <AppText variant="caption" tone="body">
                Note: {modelReport.limitations[0]}
              </AppText>
            ) : null}
            <AppText variant="caption" tone="body">
              {modelReport.disclaimer}
            </AppText>
          </View>
        ) : (
          <View style={ui.smallStack}>
            <AppText variant="subheading" tone="forest">
              {state ? "Report not ready yet" : "Choose a location first"}
            </AppText>
            <AppText variant="small" tone="body">
              {error
                ? error
                : state
                  ? `When the Prevention API is connected, this card shows the model’s incidence estimate, category, period, factors, and tips for ${area}.`
                  : "Allow location or pick a Nigerian state on Home, then return here for the model report."}
            </AppText>
          </View>
        )}
      </Card>

      <SectionHeading title="Tips from your report" />
      {modelReport?.tips?.length ? (
        modelReport.tips.map((item) => (
          <Card key={item.id}>
            <AppText variant="caption" tone="body">
              {item.group}
            </AppText>
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

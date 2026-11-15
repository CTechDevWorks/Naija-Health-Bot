import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import { AppText, Button, ui } from "./healthUi";
import { HealthIcon, IconName } from "./healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { useEnvironment } from "@/hooks/useEnvironment";

type WeatherCell = {
  icon: IconName;
  name: string;
  value: string;
};

function formatUpdatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WeatherStrip({ onChooseState }: { onChooseState?: () => void }) {
  const { width } = useWindowDimensions();
  const { status, weather, message, refreshFromGps, source } = useEnvironment();
  const loading = status === "loading";

  const cells: WeatherCell[] = weather
    ? [
        {
          icon: "sun",
          name: "Temperature",
          value: `${weather.temperatureC}°C`,
        },
        {
          icon: "drop",
          name: "Humidity",
          value: `${weather.humidityPct}%`,
        },
        {
          icon: "rain",
          name: "Rainfall",
          value: `${weather.rainfallMm} mm`,
        },
        {
          icon: "wind",
          name: "Wind",
          value: `${weather.windSpeedKmh} km/h`,
        },
      ]
    : [
        { icon: "sun", name: "Temperature", value: "—" },
        { icon: "drop", name: "Humidity", value: "—" },
        { icon: "rain", name: "Rainfall", value: "—" },
        { icon: "wind", name: "Wind", value: "—" },
      ];

  return (
    <View style={styles.card}>
      <View style={ui.sectionHeading}>
        <View style={ui.smallStack}>
          <AppText variant="subheading" tone="forest">
            Your environment
          </AppText>
          {weather ? (
            <AppText variant="caption" tone="body">
              {weather.summary}
            </AppText>
          ) : null}
        </View>
        {loading ? (
          <ActivityIndicator color={palette.forest} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh weather"
            onPress={() => void refreshFromGps()}
            hitSlop={8}
          >
            <AppText variant="caption" tone="forest">
              Refresh
            </AppText>
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => (
          <View
            key={cell.name}
            style={[styles.cell, { width: width >= 640 ? "23%" : "47%" }]}
          >
            <HealthIcon name={cell.icon} size={layout.smallIcon} />
            <View>
              <AppText variant="heading" tone="forest">
                {cell.value}
              </AppText>
              <AppText variant="caption" tone="body">
                {cell.name}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      {weather ? (
        <AppText variant="caption" tone="body">
          {weather.source}
          {source === "manual" ? " · State centre" : " · Your location"} · Updated{" "}
          {formatUpdatedAt(weather.updatedAt)}
        </AppText>
      ) : (
        <View style={ui.smallStack}>
          <AppText variant="caption" tone="body">
            {message ??
              (loading
                ? "Loading current conditions…"
                : "Weather is not available yet.")}
          </AppText>
          {(status === "needs_manual" || status === "error") && onChooseState ? (
            <Button secondary onPress={onChooseState}>
              Choose state manually
            </Button>
          ) : null}
          {status === "weather_error" ? (
            <Button secondary onPress={() => void refreshFromGps()}>
              Try again
            </Button>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: palette.softGreen,
    gap: space.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.lg },
  cell: { flexDirection: "row", alignItems: "center", gap: space.md },
});

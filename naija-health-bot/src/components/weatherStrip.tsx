import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { AppText, Button, ui } from "./healthUi";
import { HealthIcon, IconName } from "./healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { useEnvironment } from "@/hooks/useEnvironment";

type WeatherCell = {
  icon: IconName;
  name: string;
  value: string;
};

export function WeatherStrip({ onChooseState }: { onChooseState?: () => void }) {
  const { width } = useWindowDimensions();
  const { status, weather, refreshFromGps } = useEnvironment();
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
        {
          icon: "sun",
          name: "Feels like",
          value: `${weather.feelsLikeC}°C`,
        },
        {
          icon: "cloud",
          name: "Cloud cover",
          value: `${weather.cloudCoverPct}%`,
        },
      ]
    : [
        { icon: "sun", name: "Temperature", value: "—" },
        { icon: "drop", name: "Humidity", value: "—" },
        { icon: "rain", name: "Rainfall", value: "—" },
        { icon: "wind", name: "Wind", value: "—" },
        { icon: "sun", name: "Feels like", value: "—" },
        { icon: "cloud", name: "Cloud cover", value: "—" },
      ];

  return (
    <View style={styles.card}>
      <View style={ui.sectionHeading}>
        <AppText variant="subheading" tone="forest">
          Weather now
        </AppText>
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

      {!weather && !loading && (status === "needs_manual" || status === "error") && onChooseState ? (
        <Button secondary onPress={onChooseState}>
          Choose state
        </Button>
      ) : null}
      {!weather && status === "weather_error" ? (
        <Button secondary onPress={() => void refreshFromGps()}>
          Try again
        </Button>
      ) : null}
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

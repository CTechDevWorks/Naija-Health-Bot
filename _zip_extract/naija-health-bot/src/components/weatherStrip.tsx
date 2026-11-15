import { StyleSheet, View, useWindowDimensions } from "react-native";
import { AppText, ui } from "./healthUi";
import { HealthIcon, IconName } from "./healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";

const cells: { icon: IconName; name: string }[] = [
  { icon: "sun", name: "Temperature" },
  { icon: "drop", name: "Humidity" },
  { icon: "rain", name: "Rainfall" },
  { icon: "wind", name: "Wind" },
];
export function WeatherStrip() {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.card}>
      <View style={ui.sectionHeading}>
        <AppText variant="subheading" tone="forest">
          Your environment
        </AppText>
        <BadgeStatus />
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
                —
              </AppText>
              <AppText variant="caption" tone="body">
                {cell.name}
              </AppText>
            </View>
          </View>
        ))}
      </View>
      <AppText variant="caption" tone="body">
        Open-Meteo · Not connected. No current weather data.
      </AppText>
    </View>
  );
}
function BadgeStatus() {
  return (
    <AppText variant="caption" tone="body">
      Preview only
    </AppText>
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

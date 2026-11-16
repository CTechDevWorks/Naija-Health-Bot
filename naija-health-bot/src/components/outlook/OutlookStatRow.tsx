import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/healthUi";
import { layout, palette, radius, space } from "@/constants/designTokens";
import type { OutlookInsights } from "@/services/outlookData";

export function OutlookStatRow({ insights }: { insights: OutlookInsights }) {
  const changeLabel =
    insights.change5yPct < 0
      ? `${Math.abs(insights.change5yPct).toFixed(1)}% lower`
      : `${insights.change5yPct.toFixed(1)}% higher`;

  const vsNat =
    insights.vsNational === null
      ? { headline: "—", detail: "National average not available" }
      : insights.vsNational < 0
        ? {
            headline: `${Math.abs(insights.vsNational).toFixed(0)} lower`,
            detail: "Below the Nigeria-wide estimate for this year",
          }
        : insights.vsNational > 0
          ? {
              headline: `${insights.vsNational.toFixed(0)} higher`,
              detail: "Above the Nigeria-wide estimate for this year",
            }
          : {
              headline: "Same as Nigeria",
              detail: "In line with the national estimate this year",
            };

  return (
    <View style={styles.row}>
      <View style={styles.stat}>
        <AppText variant="caption" tone="body">
          Latest year ({insights.latest.year})
        </AppText>
        <AppText variant="display" tone="forest" style={styles.value}>
          {insights.latest.value.toFixed(0)}
        </AppText>
        <AppText variant="caption" tone="body">
          Estimated cases per 1,000 people in this area — not your personal risk.
        </AppText>
      </View>
      <View style={styles.stat}>
        <AppText variant="caption" tone="body">
          Since {insights.fiveYearsAgo.year}
        </AppText>
        <AppText
          variant="heading"
          tone="forest"
          style={
            insights.change5yPct <= 0 ? styles.good : styles.caution
          }
        >
          {changeLabel}
        </AppText>
        <AppText variant="caption" tone="body">
          {insights.change5yPct <= 0
            ? "The area estimate has generally fallen over five years."
            : "The area estimate has risen over five years."}
        </AppText>
      </View>
      <View style={styles.stat}>
        <AppText variant="caption" tone="body">
          Compared with Nigeria
        </AppText>
        <AppText variant="heading" tone="forest">
          {vsNat.headline}
        </AppText>
        <AppText variant="caption" tone="body">
          {vsNat.detail}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: space.md,
    flexWrap: "wrap",
  },
  stat: {
    flex: 1,
    minWidth: 100,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: layout.line,
    borderColor: palette.line,
    padding: space.md,
    gap: space.xs,
  },
  value: {
    fontSize: 28,
    lineHeight: 32,
  },
  good: { color: palette.forest },
  caution: { color: palette.body },
});
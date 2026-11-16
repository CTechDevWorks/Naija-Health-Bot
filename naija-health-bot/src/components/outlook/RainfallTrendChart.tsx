import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { AppText } from "@/components/healthUi";
import { palette, radius, space } from "@/constants/designTokens";
import type { ClimatePoint } from "@/services/outlookData";

const HEIGHT = 200;
const PADDING = { top: 36, right: 12, bottom: 40, left: 12 };

type Props = {
  series: ClimatePoint[];
  /** Show the most recent N years (keeps bars readable). */
  recentYears?: number;
};

/** Pick evenly spaced year labels that never crowd the x-axis. */
function pickYearLabels(
  years: number[],
  plotWidth: number,
): Set<number> {
  if (!years.length) return new Set();
  const minGapPx = 44;
  const maxLabels = Math.max(2, Math.floor(plotWidth / minGapPx));
  const first = years[0];
  const last = years[years.length - 1];
  if (years.length <= maxLabels) return new Set(years);

  const chosen = new Set<number>([first, last]);
  const innerSlots = maxLabels - 2;
  if (innerSlots <= 0) return chosen;

  for (let i = 1; i <= innerSlots; i++) {
    const t = i / (innerSlots + 1);
    const ideal = first + t * (last - first);
    let best = years[0];
    let bestDist = Infinity;
    for (const y of years) {
      if (y === first || y === last) continue;
      const d = Math.abs(y - ideal);
      if (d < bestDist) {
        bestDist = d;
        best = y;
      }
    }
    chosen.add(best);
  }
  return chosen;
}

export function RainfallTrendChart({ series, recentYears = 10 }: Props) {
  const [frameWidth, setFrameWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.floor(event.nativeEvent.layout.width);
    if (next > 0 && next !== frameWidth) setFrameWidth(next);
  };

  const chart = useMemo(() => {
    const sorted = [...series].sort((a, b) => a.year - b.year);
    const rows = sorted.slice(-recentYears);
    if (!rows.length || frameWidth < 80) return null;

    const width = frameWidth;
    const maxRain = Math.max(...rows.map((r) => r.rainfall));
    const niceMax = Math.ceil(maxRain / 50) * 50 || 50;
    const innerH = HEIGHT - PADDING.top - PADDING.bottom;
    const innerW = width - PADDING.left - PADDING.right;
    const barCount = rows.length;
    const barGap = Math.max(4, Math.min(10, innerW / barCount / 4));
    const barW = Math.max(6, (innerW - barGap * (barCount - 1)) / barCount);

    const bars = rows.map((row, i) => {
      const h = Math.max(4, (row.rainfall / niceMax) * innerH);
      const x = PADDING.left + i * (barW + barGap);
      const y = PADDING.top + innerH - h;
      return { ...row, x, y, w: barW, h };
    });

    const labelYears = pickYearLabels(
      rows.map((r) => r.year),
      innerW,
    );
    const latest = rows[rows.length - 1];
    const wettest = rows.reduce((best, row) =>
      row.rainfall > best.rainfall ? row : best,
    );

    return {
      width,
      bars,
      niceMax,
      innerH,
      latest,
      wettest,
      labelYears,
      plotRight: PADDING.left + innerW,
      baseline: PADDING.top + innerH,
    };
  }, [series, recentYears, frameWidth]);

  return (
    <View style={styles.wrap}>
      <AppText variant="subheading" tone="forest">
        Yearly rainfall in this area
      </AppText>
      <AppText variant="small" tone="body">
        Wet years can mean more standing water and more mosquitoes. This comes
        from NASA satellite records — one average per year for the state.
      </AppText>

      <View style={styles.chartFrame} onLayout={onLayout}>
        {!chart ? (
          <View style={styles.placeholder} />
        ) : (
          <>
            <View style={styles.metaRow}>
              <AppText variant="caption" tone="body">
                Scale to {chart.niceMax} mm
              </AppText>
              <AppText variant="caption" tone="forest">
                Latest {chart.latest.year}: {chart.latest.rainfall.toFixed(0)} mm
              </AppText>
            </View>
            <Svg width={chart.width} height={HEIGHT}>
              <Defs>
                <LinearGradient id="barShine" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={palette.primary} stopOpacity="1" />
                  <Stop
                    offset="1"
                    stopColor={palette.forest}
                    stopOpacity="0.8"
                  />
                </LinearGradient>
              </Defs>

              {[0.25, 0.5, 0.75, 1].map((frac) => {
                const y = PADDING.top + chart.innerH * (1 - frac);
                return (
                  <Line
                    key={`grid-${frac}`}
                    x1={PADDING.left}
                    x2={chart.plotRight}
                    y1={y}
                    y2={y}
                    stroke={palette.line}
                    strokeWidth={1}
                    strokeOpacity={0.9}
                  />
                );
              })}

              <Line
                x1={PADDING.left}
                x2={chart.plotRight}
                y1={chart.baseline}
                y2={chart.baseline}
                stroke={palette.muted}
                strokeWidth={1.25}
              />

              {chart.bars.map((bar) => {
                const isLatest = bar.year === chart.latest.year;
                const isWettest = bar.year === chart.wettest.year;
                const showLabel = chart.labelYears.has(bar.year);
                return (
                  <G key={bar.year}>
                    <Rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.w}
                      height={bar.h}
                      rx={Math.min(5, bar.w / 2)}
                      fill={
                        isLatest || isWettest
                          ? palette.forest
                          : "url(#barShine)"
                      }
                      opacity={isLatest || isWettest ? 1 : 0.85}
                    />
                    {showLabel ? (
                      <SvgText
                        x={bar.x + bar.w / 2}
                        y={HEIGHT - 14}
                        fontSize={11}
                        fill={palette.body}
                        fontWeight={isLatest ? "600" : "400"}
                        textAnchor="middle"
                      >
                        {String(bar.year)}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}
            </Svg>
            <View style={styles.footnoteRow}>
              <AppText variant="caption" tone="body">
                Darker bar · wettest year ({chart.wettest.year},{" "}
                {chart.wettest.rainfall.toFixed(0)} mm)
              </AppText>
            </View>
          </>
        )}
      </View>
      <AppText variant="caption" tone="body">
        mm = millimetres of rain across the year
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  chartFrame: {
    backgroundColor: palette.canvas,
    borderRadius: radius.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
    paddingHorizontal: space.sm,
    overflow: "hidden",
    width: "100%",
  },
  placeholder: { height: HEIGHT },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.sm,
    paddingHorizontal: space.xs,
    gap: space.sm,
  },
  footnoteRow: {
    marginTop: space.xs,
    paddingHorizontal: space.xs,
  },
});

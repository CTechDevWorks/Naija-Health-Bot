import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { AppText } from "@/components/healthUi";
import { palette, radius, space } from "@/constants/designTokens";
import type { IncidencePoint } from "@/services/outlookData";

const HEIGHT = 248;
const PADDING = { top: 20, right: 16, bottom: 36, left: 44 };

function scaleLinear(
  value: number,
  domain: [number, number],
  range: [number, number],
) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d1 === d0) return (r0 + r1) / 2;
  return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

function buildPath(
  points: { x: number; y: number }[],
  closeBaseline?: number,
) {
  if (!points.length) return "";
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  if (closeBaseline === undefined) return line;
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(2)} ${closeBaseline.toFixed(2)} L ${first.x.toFixed(2)} ${closeBaseline.toFixed(2)} Z`;
}

/** Round axis values to readable steps (e.g. 200, 300, 400). */
function niceTicks(min: number, max: number, count = 4): number[] {
  const span = Math.max(max - min, 1);
  const rough = span / count;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow);
  const step =
    candidates.find((c) => span / c <= count + 1) ?? candidates[candidates.length - 1];
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 0.01; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks.length ? ticks : [min, max];
}

type Props = {
  series: IncidencePoint[];
  comparison?: IncidencePoint[];
  comparisonLabel?: string;
};

export function IncidenceTrendChart({
  series,
  comparison,
  comparisonLabel = "Nigeria average",
}: Props) {
  const [frameWidth, setFrameWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.floor(event.nativeEvent.layout.width);
    if (next > 0 && next !== frameWidth) setFrameWidth(next);
  };

  const chart = useMemo(() => {
    if (!series.length || frameWidth < 80) return null;

    const width = frameWidth;
    const innerW = width - PADDING.left - PADDING.right;
    const innerH = HEIGHT - PADDING.top - PADDING.bottom;
    const baselineY = PADDING.top + innerH;
    const plotRight = PADDING.left + innerW;

    const allY = [
      ...series.map((p) => p.value),
      ...(comparison?.map((p) => p.value) ?? []),
    ];
    const yMin = Math.min(...allY);
    const yMax = Math.max(...allY);
    const yPad = (yMax - yMin) * 0.08 || 12;
    const domainY: [number, number] = [
      Math.max(0, yMin - yPad),
      yMax + yPad,
    ];
    const years = series.map((p) => p.year);
    const first = years[0];
    const last = years[years.length - 1];
    const domainX: [number, number] = [first - 0.2, last + 0.2];

    // About one label every ~56px so years stay readable on narrow phones.
    const maxXLabels = Math.max(3, Math.floor(innerW / 56));
    const span = Math.max(last - first, 1);
    const step = Math.max(1, Math.ceil(span / (maxXLabels - 1)));
    const xTicks: number[] = [];
    for (let y = first; y < last; y += step) xTicks.push(y);
    if (xTicks[xTicks.length - 1] !== last) xTicks.push(last);

    const yTickValues = niceTicks(domainY[0], domainY[1], 4);
    const domainYNice: [number, number] = [
      yTickValues[0],
      yTickValues[yTickValues.length - 1],
    ];

    const mainPtsNice = series.map((p) => ({
      x: scaleLinear(p.year, domainX, [PADDING.left, plotRight]),
      y: scaleLinear(p.value, domainYNice, [
        PADDING.top + innerH,
        PADDING.top,
      ]),
      raw: p,
    }));
    const comparePtsNice =
      comparison?.map((p) => ({
        x: scaleLinear(p.year, domainX, [PADDING.left, plotRight]),
        y: scaleLinear(p.value, domainYNice, [
          PADDING.top + innerH,
          PADDING.top,
        ]),
      })) ?? [];

    return {
      width,
      mainPts: mainPtsNice,
      comparePts: comparePtsNice,
      areaPath: buildPath(mainPtsNice, baselineY),
      linePath: buildPath(mainPtsNice),
      comparePath: comparePtsNice.length ? buildPath(comparePtsNice) : "",
      xTicks,
      yTickValues,
      domainY: domainYNice,
      domainX,
      highlight: mainPtsNice[mainPtsNice.length - 1],
      baselineY,
      plotRight,
      innerH,
      latestValue: Math.round(mainPtsNice[mainPtsNice.length - 1].raw.value),
    };
  }, [series, comparison, frameWidth]);

  return (
    <View style={styles.wrap}>
      <AppText variant="subheading" tone="forest">
        How estimates changed over time
      </AppText>
      <AppText variant="small" tone="body">
        Each point is a year. Higher lines mean more estimated malaria cases per
        1,000 people across the whole state or FCT — not one person’s odds of
        getting sick.
      </AppText>

      <View style={styles.chartFrame} onLayout={onLayout}>
        {!chart ? (
          <View style={styles.placeholder} />
        ) : (
          <>
            <AppText variant="caption" tone="body" style={styles.axisTitle}>
              Cases per 1,000 people
            </AppText>
            <Svg width={chart.width} height={HEIGHT}>
              <Defs>
                <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={palette.primary}
                    stopOpacity="0.35"
                  />
                  <Stop
                    offset="1"
                    stopColor={palette.primary}
                    stopOpacity="0"
                  />
                </LinearGradient>
              </Defs>

              {chart.yTickValues.map((v) => {
                const y = scaleLinear(v, chart.domainY, [
                  PADDING.top + chart.innerH,
                  PADDING.top,
                ]);
                return (
                  <G key={`grid-${v}`}>
                    <Line
                      x1={PADDING.left}
                      x2={chart.plotRight}
                      y1={y}
                      y2={y}
                      stroke={palette.line}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={PADDING.left - 8}
                      y={y + 4}
                      fontSize={11}
                      fill={palette.body}
                      textAnchor="end"
                    >
                      {Math.round(v)}
                    </SvgText>
                  </G>
                );
              })}

              <Line
                x1={PADDING.left}
                x2={chart.plotRight}
                y1={chart.baselineY}
                y2={chart.baselineY}
                stroke={palette.muted}
                strokeWidth={1.25}
              />

              {chart.areaPath ? (
                <Path d={chart.areaPath} fill="url(#areaFill)" />
              ) : null}
              {chart.comparePath ? (
                <Path
                  d={chart.comparePath}
                  fill="none"
                  stroke={palette.muted}
                  strokeWidth={2}
                  strokeDasharray="6 5"
                />
              ) : null}
              <Path
                d={chart.linePath}
                fill="none"
                stroke={palette.forest}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Circle
                cx={chart.highlight.x}
                cy={chart.highlight.y}
                r={5}
                fill={palette.white}
                stroke={palette.forest}
                strokeWidth={2.5}
              />
              <SvgText
                x={Math.min(chart.highlight.x + 8, chart.plotRight)}
                y={Math.max(chart.highlight.y - 12, PADDING.top + 12)}
                fontSize={11}
                fill={palette.forest}
                fontWeight="600"
                textAnchor={
                  chart.highlight.x > chart.plotRight - 48 ? "end" : "start"
                }
              >
                {`${chart.latestValue} · ${chart.highlight.raw.year}`}
              </SvgText>

              {chart.xTicks.map((year) => {
                const x = scaleLinear(year, chart.domainX, [
                  PADDING.left,
                  chart.plotRight,
                ]);
                return (
                  <SvgText
                    key={`x-${year}`}
                    x={x}
                    y={HEIGHT - 12}
                    fontSize={11}
                    fill={palette.body}
                    textAnchor="middle"
                  >
                    {year}
                  </SvgText>
                );
              })}
            </Svg>
          </>
        )}
      </View>

      {comparison?.length ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendPrimary]} />
            <AppText variant="caption" tone="body">
              Your area
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendDash]} />
            <AppText variant="caption" tone="body">
              {comparisonLabel}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.md,
  },
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
  axisTitle: {
    marginLeft: PADDING.left - 4,
    marginBottom: space.xs,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  legendSwatch: {
    width: 22,
    height: 3,
    borderRadius: radius.pill,
  },
  legendPrimary: {
    backgroundColor: palette.forest,
  },
  legendDash: {
    backgroundColor: palette.muted,
    opacity: 0.85,
  },
});

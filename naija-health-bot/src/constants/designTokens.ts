import { Platform, TextStyle } from "react-native";

/** Brand values supplied in the UI brief; contrast-safe extensions are documented in §17. */
export const palette = {
  primary: "#7DBA87",
  cream: "#F5ECD4",
  ink: "#232323",
  muted: "#78847B",
  forest: "#204632",
  body: "#59675E",
  canvas: "#FCFBF7",
  white: "#FFFFFF",
  softGreen: "#EDF3E9",
  line: "#E4E8DE",
  backdrop: "#E9EDE6",
  scrim: "rgba(35,35,35,0.35)",
  transparent: "transparent",
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 48,
  huge: 64,
} as const;
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 9999,
} as const;
export const layout = {
  reading: 560,
  touch: 48,
  icon: 24,
  smallIcon: 18,
  tabIcon: 23,
  tabHeight: 72,
  avatar: 44,
  featureIcon: 56,
  heroIcon: 80,
  sheetMax: 680,
  line: 1,
} as const;
const fontFamily = Platform.OS === "web" ? "Inter, sans-serif" : "Inter";
const text = (
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyle["fontWeight"],
) => ({
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  color: palette.ink,
});
export const typography = {
  display: { ...text(34, 42, "700"), letterSpacing: -1.2 },
  title: { ...text(28, 36, "700"), letterSpacing: -0.8 },
  heading: { ...text(20, 28, "600"), letterSpacing: -0.5 },
  subheading: text(16, 24, "600"),
  body: text(15, 24, "400"),
  small: text(13, 20, "400"),
  label: text(13, 20, "600"),
  button: text(14, 22, "500"),
  caption: text(12, 18, "400"),
  eyebrow: { ...text(10, 16, "600"), letterSpacing: 1.5 },
  tab: text(10, 16, "500"),
} as const;

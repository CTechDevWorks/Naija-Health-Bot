import { ComponentProps } from "react";
import { SymbolView } from "expo-symbols";
import { layout, palette } from "@/constants/designTokens";

type SymbolName = ComponentProps<typeof SymbolView>["name"];
const names = {
  home: { ios: "house", android: "home", web: "home" },
  outlook: {
    ios: "chart.xyaxis.line",
    android: "monitoring",
    web: "monitoring",
  },
  shield: { ios: "shield.lefthalf.filled", android: "shield", web: "shield" },
  chat: { ios: "bubble.left.and.bubble.right", android: "forum", web: "forum" },
  news: { ios: "newspaper", android: "newspaper", web: "newspaper" },
  person: {
    ios: "person.crop.circle",
    android: "account_circle",
    web: "account_circle",
  },
  pin: {
    ios: "mappin.and.ellipse",
    android: "location_on",
    web: "location_on",
  },
  chevron: {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
  down: { ios: "chevron.down", android: "expand_more", web: "expand_more" },
  back: { ios: "arrow.left", android: "arrow_back", web: "arrow_back" },
  arrow: { ios: "arrow.up.right", android: "north_east", web: "north_east" },
  right: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  close: { ios: "xmark", android: "close", web: "close" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  sun: { ios: "sun.max", android: "sunny", web: "sunny" },
  drop: { ios: "drop", android: "water_drop", web: "water_drop" },
  rain: { ios: "cloud.rain", android: "rainy", web: "rainy" },
  wind: { ios: "wind", android: "air", web: "air" },
  leaf: { ios: "leaf", android: "eco", web: "eco" },
  heart: { ios: "heart", android: "favorite", web: "favorite" },
  book: { ios: "book", android: "menu_book", web: "menu_book" },
  sparkle: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  info: { ios: "info.circle", android: "info", web: "info" },
  check: { ios: "checkmark", android: "check", web: "check" },
  plus: { ios: "plus", android: "add", web: "add" },
  send: { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" },
  bell: { ios: "bell", android: "notifications", web: "notifications" },
  history: {
    ios: "clock.arrow.circlepath",
    android: "history",
    web: "history",
  },
  lock: { ios: "lock", android: "lock", web: "lock" },
  help: { ios: "questionmark.circle", android: "help", web: "help" },
  external: {
    ios: "arrow.up.right.square",
    android: "open_in_new",
    web: "open_in_new",
  },
  bed: { ios: "bed.double", android: "bed", web: "bed" },
  food: { ios: "carrot", android: "nutrition", web: "nutrition" },
  illness: {
    ios: "thermometer.medium",
    android: "thermometer",
    web: "thermometer",
  },
  alert: {
    ios: "exclamationmark.triangle",
    android: "warning",
    web: "warning",
  },
} satisfies Record<string, SymbolName>;
export type IconName = keyof typeof names;

export function HealthIcon({
  name,
  size = layout.icon,
  color = palette.forest,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <SymbolView name={names[name]} size={size} tintColor={color} />;
}

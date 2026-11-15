import { Stack, router, usePathname, Href } from "expo-router";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { AppText } from "./healthUi";
import { HealthIcon, IconName } from "./healthIcon";

const tabs: { label: string; path: Href; icon: IconName }[] = [
  { label: "Home", path: "/", icon: "home" },
  { label: "Outlook", path: "/outlook", icon: "outlook" },
  { label: "Prevention", path: "/prevention", icon: "shield" },
  { label: "Assistant", path: "/assistant", icon: "chat" },
  { label: "Updates", path: "/updates", icon: "news" },
];
export default function AppShell() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.stage}>
      <View style={[styles.phone, { paddingTop: insets.top }]}>
        <View style={styles.routes}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.canvas },
              animation: "fade",
              animationDuration: 150,
            }}
          />
        </View>
        <View
          style={[
            styles.nav,
            { paddingBottom: Math.max(insets.bottom, space.sm) },
          ]}
        >
          {tabs.map((tab) => {
            const active = pathname === tab.path;
            return (
              <Pressable
                key={tab.label}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                onPress={() => router.replace(tab.path)}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              >
                <View style={[styles.icon, active && styles.activeIcon]}>
                  <HealthIcon
                    name={tab.icon}
                    size={layout.tabIcon}
                    color={active ? palette.forest : palette.body}
                  />
                </View>
                <AppText variant="tab" tone={active ? "forest" : "body"}>
                  {tab.label}
                </AppText>
                {active && <View style={styles.activeDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: palette.backdrop, alignItems: "center" },
  phone: {
    width: "100%",
    maxWidth: layout.reading,
    flex: 1,
    backgroundColor: palette.canvas,
    borderLeftWidth: Platform.OS === "web" ? layout.line : 0,
    borderRightWidth: Platform.OS === "web" ? layout.line : 0,
    borderColor: palette.line,
  },
  routes: { flex: 1, overflow: "hidden" },
  nav: {
    backgroundColor: palette.canvas,
    borderTopWidth: layout.line,
    borderColor: palette.line,
    flexDirection: "row",
    paddingTop: space.sm,
    minHeight: layout.tabHeight,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xxs,
    minHeight: layout.touch,
  },
  icon: {
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
  },
  activeIcon: { backgroundColor: palette.softGreen },
  activeDot: {
    width: space.xs,
    height: space.xs,
    borderRadius: radius.pill,
    backgroundColor: palette.forest,
  },
  pressed: { opacity: 0.65 },
});

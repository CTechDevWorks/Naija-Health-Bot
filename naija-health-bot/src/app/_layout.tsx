import { DefaultTheme, ThemeProvider } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import AppTabs from "@/components/app-tabs";
import { PrototypeProvider } from "@/hooks/usePrototype";
import { palette } from "@/constants/designTokens";
import "@/global.css";

SplashScreen.preventAutoHideAsync();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.canvas,
    card: palette.canvas,
    text: palette.ink,
    primary: palette.forest,
    border: palette.line,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: require("@/assets/fonts/Inter.ttf"),
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <ThemeProvider value={theme}>
      <PrototypeProvider>
        <StatusBar style="dark" />
        <AppTabs />
      </PrototypeProvider>
    </ThemeProvider>
  );
}

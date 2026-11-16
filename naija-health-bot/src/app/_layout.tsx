import { DefaultTheme, ThemeProvider } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import AppTabs from "@/components/app-tabs";
import { AuthProvider } from "@/hooks/useAuth";
import { EnvironmentProvider } from "@/hooks/useEnvironment";
import { PrototypeProvider } from "@/hooks/usePrototype";
import { UpdatePushProvider } from "@/hooks/useUpdatePush";
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
      <AuthProvider>
        <EnvironmentProvider>
          <PrototypeProvider>
            <UpdatePushProvider>
              <StatusBar style="dark" />
              <AppTabs />
            </UpdatePushProvider>
          </PrototypeProvider>
        </EnvironmentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

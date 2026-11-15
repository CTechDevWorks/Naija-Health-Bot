import { router } from "expo-router";
import { View } from "react-native";
import {
  AppText,
  Button,
  Card,
  Disclaimer,
  Screen,
  SectionHeading,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { useEnvironment } from "@/hooks/useEnvironment";

export default function OutlookScreen() {
  const { state } = useEnvironment();
  const area = state ?? "your area";

  return (
    <Screen
      title="Outlook"
      subtitle={state ? `${state}, Nigeria` : "Set a location on Home"}
    >
      <Card soft>
        <HealthIcon name="outlook" />
        <AppText variant="title" tone="forest">
          Trends for {area}
        </AppText>
        <AppText tone="body">
          Dataset trends for this area will show here once they are connected.
        </AppText>
      </Card>

      <View style={ui.smallStack}>
        <SectionHeading title="Trend history" />
        <Card>
          <AppText variant="subheading">No trend data yet</AppText>
          <AppText tone="body">
            Charts and period comparisons appear when area datasets are added.
          </AppText>
        </Card>
      </View>

      <Button icon="shield" onPress={() => router.push("/prevention")}>
        Open prevention report
      </Button>
      <Disclaimer />
    </Screen>
  );
}

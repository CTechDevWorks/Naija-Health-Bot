import { useMemo } from "react";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  Disclaimer,
  Screen,
  SectionHeading,
  ui,
} from "@/components/healthUi";
import { IncidenceTrendChart } from "@/components/outlook/IncidenceTrendChart";
import { OutlookStatRow } from "@/components/outlook/OutlookStatRow";
import { RainfallTrendChart } from "@/components/outlook/RainfallTrendChart";
import { HealthIcon } from "@/components/healthIcon";
import { space } from "@/constants/designTokens";
import { useEnvironment } from "@/hooks/useEnvironment";
import {
  climateForIncidenceYears,
  computeInsights,
  getOutlookForState,
} from "@/services/outlookData";

export default function OutlookScreen() {
  const { state } = useEnvironment();
  const bundle = useMemo(() => getOutlookForState(state), [state]);
  const insights = useMemo(
    () =>
      bundle
        ? computeInsights(bundle.incidence, bundle.national)
        : null,
    [bundle],
  );
  const climateSeries = useMemo(
    () =>
      bundle
        ? climateForIncidenceYears(bundle.climate, bundle.incidence)
        : [],
    [bundle],
  );

  const area = state ?? "your area";

  return (
    <Screen title="Outlook" subtitle={state ? `${area}, Nigeria` : "Set location on Home"}>
      {!bundle || !insights ? (
        <Card soft>
          <HealthIcon name="pin" />
          <AppText variant="title" tone="forest">
            Choose your state on Home
          </AppText>
          <AppText tone="body">
            We will show long-term malaria and rainfall patterns for your state or FCT.
          </AppText>
          <Button onPress={() => router.push("/")}>Go to Home</Button>
        </Card>
      ) : (
        <>
          <Card soft style={styles.hero}>
            <View style={ui.row}>
              <Badge>AREA TRENDS</Badge>
            </View>
            <AppText variant="title" tone="forest">
              Malaria patterns in {area}
            </AppText>
            <AppText variant="small" tone="body">
              These numbers describe the whole state or FCT over many years. They
              help you see the bigger picture — they do not tell you if you or
              anyone in your household has malaria.
            </AppText>
            <OutlookStatRow insights={insights} />
          </Card>

          <Card style={styles.chartCard}>
            <IncidenceTrendChart
              series={bundle.incidence}
              comparison={bundle.national}
              comparisonLabel="Average for all of Nigeria"
            />
          </Card>

          <View style={ui.smallStack}>
            <SectionHeading title="Rainfall over the years" />
            <Card style={styles.chartCard}>
              <RainfallTrendChart series={climateSeries} recentYears={10} />
            </Card>
          </View>

          <Card soft>
            <AppText variant="subheading" tone="forest">
              How to read this page
            </AppText>
            <AppText variant="small" tone="body">
              Figures come from the Malaria Atlas Project and NASA POWER. The
              busiest year in this dataset for {area} was {insights.peak.year}{" "}
              (about {insights.peak.value.toFixed(0)} estimated cases per 1,000
              people). For questions about symptoms or treatment, use the
              Assistant or see a health professional.
            </AppText>
          </Card>
        </>
      )}

      <Button icon="shield" onPress={() => router.push("/prevention")}>
        Open prevention report
      </Button>
      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: space.md,
  },
  chartCard: {
    padding: space.lg,
    gap: space.md,
    overflow: "hidden",
  },
});
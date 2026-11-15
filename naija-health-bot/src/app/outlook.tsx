import { router } from "expo-router";
import { View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  Disclaimer,
  Screen,
  SectionHeading,
  SourceLink,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { WeatherStrip } from "@/components/weatherStrip";
import { useEnvironment } from "@/hooks/useEnvironment";
import { sources } from "@/constants/healthContent";

export default function OutlookScreen() {
  const { state, source, weather } = useEnvironment();
  const area = state ?? "your area";
  const locationLine = state
    ? `${state}, Nigeria · ${source === "gps" ? "GPS" : source === "manual" ? "Manual" : "Location"}`
    : "Location not set yet";
  return (
    <Screen title="Your local outlook" subtitle={locationLine}>
      <Card soft>
        <Badge>
          {weather ? "LIVE WEATHER · OUTLOOK COMING" : "WAITING FOR LOCATION"}
        </Badge>
        <AppText variant="title" tone="forest">
          The bigger picture.{"\n"}Not a personal diagnosis.
        </AppText>
        <AppText tone="body">
          {weather
            ? `Right now in ${area}: ${weather.summary.toLowerCase()}, ${weather.temperatureC}°C, ${weather.humidityPct}% humidity, ${weather.rainfallMm} mm rain today.`
            : "Local weather appears once location is ready. Area-level malaria estimates will connect next."}
        </AppText>
        <AppText variant="small" tone="body">
          No malaria model is connected yet, so we cannot show an incidence
          estimate, category or prediction period for {area}.
        </AppText>
      </Card>
      <View style={ui.stack}>
        <SectionHeading title="What an outlook tells you" />
        <Card>
          <HealthIcon name="outlook" />
          <AppText variant="subheading">Patterns across an area</AppText>
          <AppText tone="body">
            An estimate describes a population, place and time period. It can
            provide context for prevention and awareness.
          </AppText>
        </Card>
        <Card>
          <HealthIcon name="person" />
          <AppText variant="subheading">
            Not your personal chance of illness
          </AppText>
          <AppText tone="body">
            It cannot diagnose malaria or tell whether you will become ill.
            Symptoms should be assessed by a qualified health professional.
          </AppText>
        </Card>
      </View>
      <View style={ui.smallStack}>
        <SectionHeading title="Trends over time" />
        <Card>
          <HealthIcon name="outlook" />
          <AppText variant="subheading">
            Trend data isn’t available for this area yet.
          </AppText>
          <AppText variant="small" tone="body">
            There are no model results to plot. We do not substitute fictional
            predictions.
          </AppText>
        </Card>
      </View>
      <WeatherStrip />
      <Card>
        <AppText variant="subheading">Built on transparency</AppText>
        <AppText tone="body">
          Weather: Open-Meteo. Planned malaria sources: Malaria Atlas Project.
          Model outputs, dates, training periods and limitations will be shown
          when those services are integrated.
        </AppText>
        <SourceLink title="Learn about malaria · WHO" url={sources.malaria} />
      </Card>
      <Button icon="shield" onPress={() => router.push("/prevention")}>
        Focus on what you can do
      </Button>
      <Disclaimer />
    </Screen>
  );
}

import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  AppText,
  Badge,
  Card,
  ChoiceChip,
  Disclaimer,
  Screen,
  SearchField,
  SourceLink,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { palette } from "@/constants/designTokens";
import {
  fetchHealthReports,
  formatReportDate,
  topicLabel,
  urgencyLabel,
  type HealthReport,
} from "@/services/healthReportsApi";

const authorities = [
  {
    title: "Nigeria Centre for Disease Control and Prevention",
    tag: "Public health",
    url: "https://ncdc.gov.ng/",
    description:
      "Official disease surveillance, public-health guidance and situation reports.",
  },
  {
    title: "Federal Ministry of Health and Social Welfare",
    tag: "National health",
    url: "https://health.gov.ng/",
    description:
      "National health information and policy from the federal ministry.",
  },
  {
    title: "National Primary Health Care Development Agency",
    tag: "Primary care",
    url: "https://nphcda.gov.ng/",
    description: "Official information on primary healthcare and immunisation.",
  },
];

export default function UpdatesScreen() {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const load = useCallback(async (mode: "focus" | "refresh" = "focus") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const next = await fetchHealthReports(30);
      setReports(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Health updates are unavailable right now.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void load("focus").then(() => {
        if (!alive) return;
      });
      return () => {
        alive = false;
      };
    }, [load]),
  );

  const filteredReports = reports.filter((report) => {
    const scopeOk =
      filter === "All" ||
      (filter === "Nigeria" && report.location_scope === "nigeria") ||
      (filter === "Global" &&
        (report.location_scope === "global" ||
          report.location_scope === "west_africa"));
    if (!scopeOk) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = `${report.title} ${report.summary} ${report.source?.name ?? ""} ${report.topic}`.toLowerCase();
    return hay.includes(q);
  });

  return (
    <Screen
      title="Informed, not overwhelmed."
      subtitle="Official health updates, summarised for clarity."
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load("refresh")}
          tintColor={palette.forest}
        />
      }
    >
      {loading ? (
        <View style={ui.stack}>
          <ActivityIndicator color={palette.forest} />
          <AppText tone="body">Loading today’s health updates…</AppText>
        </View>
      ) : null}

      {!loading && error ? (
        <Card soft>
          <Badge>FEED UNAVAILABLE</Badge>
          <HealthIcon name="news" />
          <AppText variant="heading" tone="forest">
            Couldn’t load live updates
          </AppText>
          <AppText tone="body">{error}</AppText>
          <AppText variant="caption" tone="body">
            Pull to refresh, or use the official directory below.
          </AppText>
        </Card>
      ) : null}

      {!loading && !error && filteredReports.length === 0 ? (
        <Card soft>
          <Badge>NO REPORTS YET</Badge>
          <HealthIcon name="news" />
          <AppText variant="heading" tone="forest">
            Today’s briefing isn’t ready
          </AppText>
          <AppText tone="body">
            Fresh reports appear after the daily scrape finishes. Meanwhile,
            explore official Nigerian health authorities below.
          </AppText>
        </Card>
      ) : null}

      {!loading && reports.length > 0 ? (
        <>
          <SearchField
            placeholder="Search updates"
            value={query}
            onChangeText={setQuery}
          />
          <View style={ui.row}>
            {["All", "Nigeria", "Global"].map((item) => (
              <ChoiceChip
                key={item}
                label={item}
                active={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
          </View>
          {filteredReports.map((report) => (
            <Card key={report.id} soft>
              <View style={ui.row}>
                <Badge>{topicLabel(report.topic)}</Badge>
                {report.urgency !== "low" ? (
                  <Badge>{urgencyLabel(report.urgency)}</Badge>
                ) : null}
                {report.is_ai_summary ? <Badge>AI SUMMARY</Badge> : null}
              </View>
              <AppText variant="heading" tone="forest">
                {report.title}
              </AppText>
              <AppText variant="caption" tone="body">
                {report.source?.name ?? "Official source"}
                {report.published_at
                  ? ` · ${formatReportDate(report.published_at)}`
                  : ""}
              </AppText>
              <AppText tone="body">{report.summary}</AppText>
              <SourceLink title="Read the original" url={report.original_url} />
            </Card>
          ))}
        </>
      ) : null}

      <AppText variant="heading" tone="forest">
        Official directory
      </AppText>
      <AppText tone="body">
        Named authorities you can always check directly.
      </AppText>
      {authorities.map((authority) => (
        <Card key={authority.url} soft>
          <Badge>{authority.tag}</Badge>
          <AppText variant="heading" tone="forest">
            {authority.title}
          </AppText>
          <AppText tone="body">{authority.description}</AppText>
          <SourceLink title="Open official site" url={authority.url} />
        </Card>
      ))}
      <Disclaimer />
    </Screen>
  );
}

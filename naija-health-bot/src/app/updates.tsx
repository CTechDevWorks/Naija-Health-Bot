import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  AppText,
  Badge,
  Card,
  Disclaimer,
  Screen,
  SourceLink,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { palette } from "@/constants/designTokens";
import {
  fetchHealthReports,
  formatReportDate,
  topicLabel,
  type HealthReport,
} from "@/services/healthReportsApi";

const FEED_LIMIT = 5;

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

function WriteUp({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const blocks = paragraphs.length > 0 ? paragraphs : [text.trim()].filter(Boolean);
  return (
    <View style={ui.stack}>
      {blocks.map((paragraph, index) => (
        <AppText key={`p-${index}`} tone="body">
          {paragraph}
        </AppText>
      ))}
    </View>
  );
}

export default function UpdatesScreen() {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "focus" | "refresh" = "focus") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const next = await fetchHealthReports(FEED_LIMIT);
      setReports(next.slice(0, FEED_LIMIT));
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

  return (
    <Screen
      title="Informed, not overwhelmed."
      subtitle="Five daily write-ups from official health sources."
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

      {!loading && !error && reports.length === 0 ? (
        <Card soft>
          <Badge>NO REPORTS YET</Badge>
          <HealthIcon name="news" />
          <AppText variant="heading" tone="forest">
            Today’s briefing isn’t ready
          </AppText>
          <AppText tone="body">
            Fresh write-ups appear after the 7:00 AM Africa/Lagos run. Meanwhile,
            explore official Nigerian health authorities below.
          </AppText>
        </Card>
      ) : null}

      {!loading &&
        reports.map((report, index) => (
          <Card key={report.id} soft>
            <View style={ui.row}>
              <Badge>{`Update ${index + 1} of ${reports.length}`}</Badge>
              <Badge>{topicLabel(report.topic)}</Badge>
              {report.is_ai_summary ? <Badge>AI WRITE-UP</Badge> : null}
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
            <WriteUp text={report.summary} />
            <SourceLink title="Read the original" url={report.original_url} />
          </Card>
        ))}

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

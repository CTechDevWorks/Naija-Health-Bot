import { useState } from "react";
import { View } from "react-native";
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All sources");
  const filtered = authorities.filter(
    (authority) =>
      (filter === "All sources" || authority.tag === filter) &&
      `${authority.title} ${authority.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <Screen
      title="Informed, not overwhelmed."
      subtitle="Health information from sources you can name."
    >
      <Card soft>
        <Badge>LIVE FEED NOT CONNECTED</Badge>
        <HealthIcon name="news" />
        <AppText variant="heading" tone="forest">
          Good information deserves a clear source.
        </AppText>
        <AppText tone="body">
          There are no live reports in this prototype. In the meantime, explore
          official Nigerian health authorities below.
        </AppText>
        <AppText variant="caption" tone="body">
          No sample story is presented as an official report.
        </AppText>
      </Card>
      <SearchField
        placeholder="Search official sources"
        value={query}
        onChangeText={setQuery}
      />
      <View style={ui.row}>
        {["All sources", "Public health"].map((item) => (
          <ChoiceChip
            key={item}
            label={item}
            active={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>
      <AppText variant="heading">Official source directory</AppText>
      {filtered.length === 0 && (
        <Card>
          <AppText variant="subheading">No sources found</AppText>
          <AppText tone="body">
            Try a different search, or choose “All sources”.
          </AppText>
        </Card>
      )}
      {filtered.map((authority) => (
        <Card key={authority.title}>
          <Badge>{authority.tag.toUpperCase()}</Badge>
          <AppText variant="heading" tone="forest">
            {authority.title}
          </AppText>
          <AppText tone="body">{authority.description}</AppText>
          <SourceLink title="Visit the official website" url={authority.url} />
          <AppText variant="caption" tone="body">
            Source directory · Not an article or a live update
          </AppText>
        </Card>
      ))}
      <Disclaimer />
    </Screen>
  );
}

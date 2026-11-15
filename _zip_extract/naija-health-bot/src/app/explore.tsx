import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  ChoiceChip,
  Disclaimer,
  Screen,
  SearchField,
  SectionHeading,
  Sheet,
  SourceLink,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import {
  Article,
  articles,
  contentDate,
  starters,
  Topic,
} from "@/constants/healthContent";
import { usePrototype } from "@/hooks/usePrototype";

const topics: Topic[] = [
  "All topics",
  "Nutrition",
  "Wellness",
  "Common illnesses",
  "Prevention",
];
const faq = [
  {
    question: "Is every fever a sign of malaria?",
    answer:
      "No. Fever can have many causes. Symptoms alone cannot confirm malaria. A qualified health professional can assess you and arrange appropriate testing.",
  },
  {
    question: "Can this app diagnose an illness?",
    answer:
      "No. 9ja Health provides general health information, not a diagnosis, medication advice or a treatment plan. This prototype has prepared sample answers, not a connected AI service.",
  },
  {
    question: "When should I seek urgent help?",
    answer:
      "Severe or worrying symptoms — including difficulty breathing, confusion, seizures or severe bleeding — need urgent medical care. Call 112 in Nigeria or go to the nearest emergency department. Do not wait for this app.",
  },
];
export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic>("All topics");
  const [article, setArticle] = useState<Article | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const { send } = usePrototype();
  const filtered = articles.filter(
    (item) =>
      (topic === "All topics" || item.category === topic) &&
      `${item.title} ${item.description} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  function ask(question: string) {
    send(question);
    router.push("/assistant");
  }
  return (
    <>
      <Screen
        title="A little more in the know."
        subtitle="Simple answers. Healthier everyday choices."
        back
      >
        <SearchField
          placeholder="What would you like to learn?"
          value={query}
          onChangeText={setQuery}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {topics.map((item) => (
            <ChoiceChip
              key={item}
              label={item}
              active={topic === item}
              onPress={() => setTopic(item)}
            />
          ))}
        </ScrollView>
        {topic === "All topics" && !query.trim() && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Read Small habits. Better protection."
            onPress={() => setArticle(articles[0])}
            style={({ pressed }) => [styles.feature, pressed && ui.pressed]}
          >
            <View style={ui.sectionHeading}>
              <Badge cream>THE EVERYDAY GUIDE</Badge>
              <HealthIcon name="arrow" />
            </View>
            <View style={styles.featureIcon}>
              <HealthIcon name="shield" size={space.section} />
            </View>
            <AppText variant="title" tone="forest">
              Small habits.{"\n"}Better protection.
            </AppText>
            <AppText tone="body">
              A practical guide to preventing mosquito bites, one simple step at
              a time.
            </AppText>
            <AppText variant="caption" tone="forest">
              Prevention · 3 min read · Curated education
            </AppText>
          </Pressable>
        )}
        <View style={ui.stack}>
          <SectionHeading
            title={
              query
                ? `Search results (${filtered.length})`
                : "Made for everyday living"
            }
          />
          {filtered.length === 0 && (
            <Card>
              <HealthIcon name="search" />
              <AppText variant="heading">No topics found — yet.</AppText>
              <AppText tone="body">
                Try “nutrition”, “fever” or another everyday health topic.
              </AppText>
              <Button
                secondary
                onPress={() => {
                  setQuery("");
                  setTopic("All topics");
                }}
              >
                Clear search and filters
              </Button>
            </Card>
          )}
          {filtered.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Read ${item.title}`}
              onPress={() => setArticle(item)}
              style={({ pressed }) => [styles.article, pressed && ui.pressed]}
            >
              <View style={styles.articleIcon}>
                <HealthIcon name={item.icon} />
              </View>
              <View style={ui.flex}>
                <AppText variant="eyebrow" tone="forest">
                  {item.category.toUpperCase()}
                </AppText>
                <AppText variant="subheading">{item.title}</AppText>
                <AppText variant="small" tone="body">
                  {item.description}
                </AppText>
                <AppText variant="caption" tone="body">
                  {item.minutes} min read · {item.source}
                </AppText>
              </View>
              <HealthIcon name="chevron" size={layout.smallIcon} />
            </Pressable>
          ))}
        </View>
        <View style={ui.smallStack}>
          <SectionHeading title="You might be wondering…" />
          {faq.map((item, index) => (
            <View key={item.question} style={styles.faq}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: expanded === index }}
                onPress={() => setExpanded(expanded === index ? null : index)}
                style={styles.faqButton}
              >
                <AppText variant="button" tone="forest" style={ui.flex}>
                  {item.question}
                </AppText>
                <HealthIcon
                  name={expanded === index ? "close" : "plus"}
                  size={layout.smallIcon}
                />
              </Pressable>
              {expanded === index && (
                <View style={styles.faqAnswer}>
                  <AppText tone="body">{item.answer}</AppText>
                  <AppText variant="caption" tone="body">
                    Curated educational copy · {contentDate}
                  </AppText>
                  {index === 0 && (
                    <SourceLink title="WHO · Malaria" url={articles[0].url} />
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
        <Card soft>
          <HealthIcon name="chat" />
          <AppText variant="heading" tone="forest">
            Keep the conversation going.
          </AppText>
          <AppText tone="body">
            Try a prepared question with your health companion.
          </AppText>
          <Button icon="right" onPress={() => ask(starters[0])}>
            How does malaria spread?
          </Button>
        </Card>
        <Disclaimer />
      </Screen>
      <Sheet
        visible={!!article}
        title="The everyday guide"
        onClose={() => setArticle(null)}
      >
        {article && (
          <>
            <Badge>{article.category.toUpperCase()}</Badge>
            <AppText variant="title" tone="forest">
              {article.title}
            </AppText>
            <AppText variant="caption" tone="body">
              {article.minutes} min read · Curated education · {contentDate}
            </AppText>
            <AppText>{article.body}</AppText>
            <SourceLink title={article.source} url={article.url} />
            <Disclaimer />
            <Button
              icon="chat"
              onPress={() => {
                const related =
                  article.id === "symptoms"
                    ? starters[2]
                    : article.id === "nutrition"
                      ? "How can I build a healthy diet?"
                      : article.id === "wellness"
                        ? "How can I add more physical activity?"
                        : starters[1];
                setArticle(null);
                ask(related);
              }}
            >
              Ask a related question
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}
const styles = StyleSheet.create({
  chips: { gap: space.sm },
  feature: {
    borderRadius: radius.lg,
    backgroundColor: palette.softGreen,
    padding: space.xl,
    gap: space.lg,
  },
  featureIcon: {
    width: layout.heroIcon,
    height: layout.heroIcon,
    backgroundColor: palette.cream,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: space.md,
  },
  article: {
    flexDirection: "row",
    gap: space.md,
    padding: space.lg,
    backgroundColor: palette.white,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.md,
    alignItems: "center",
  },
  articleIcon: {
    width: layout.avatar,
    height: layout.avatar,
    backgroundColor: palette.cream,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  faq: {
    backgroundColor: palette.white,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.md,
  },
  faqButton: {
    flexDirection: "row",
    gap: space.md,
    padding: space.lg,
    minHeight: layout.touch,
    alignItems: "center",
  },
  faqAnswer: { padding: space.lg, paddingTop: 0, gap: space.md },
});

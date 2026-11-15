import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/appText';
import { Screen } from '@/components/ui/screen';
import { colors, rounded, spacing } from '@/constants/theme';

const STARTERS = [
  'How does malaria spread?',
  'What can I do to prevent mosquito bites?',
  'What are common malaria symptoms?',
  'When should someone get tested?',
  'What does area-level risk mean?',
  'Why does rain matter for malaria here?',
];

export default function AssistantScreen() {
  return (
    <Screen>
      <AppText variant="displayMd">Assistant</AppText>
      <View style={styles.scope}>
        <AppText variant="bodySm" color={colors.body}>
          I can explain prevention, general symptoms, testing, and related topics from
          trusted sources. I cannot diagnose you or prescribe medication.
        </AppText>
      </View>

      <AppText variant="headingMd">Try asking</AppText>
      <View style={styles.chipWrap}>
        {STARTERS.map((q) => (
          <View key={q} style={styles.chip}>
            <AppText variant="buttonSm" color={colors.ink}>
              {q}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="caption" color={colors.muted}>
        Chat composer and grounded answers with citations will connect here.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scope: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    padding: spacing.lg,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: rounded.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

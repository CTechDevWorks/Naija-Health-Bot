import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/appText';
import { Screen } from '@/components/ui/screen';
import { colors, rounded, spacing } from '@/constants/theme';

const GROUPS = [
  'Around the home',
  'When sleeping',
  'Out and about',
  'If someone feels unwell',
] as const;

export default function PreventionScreen() {
  return (
    <Screen>
      <AppText variant="displayMd">Prevention</AppText>
      <AppText variant="bodyMd" color={colors.body}>
        Evidence-based actions from the rules engine — simple, doable, non-alarmist.
      </AppText>

      {GROUPS.map((group) => (
        <View key={group} style={styles.group}>
          <AppText variant="headingMd">{group}</AppText>
          <AppText variant="bodySm" color={colors.muted}>
            Recommendations for this group will appear when the prevention service is connected.
          </AppText>
        </View>
      ))}

      <AppText variant="micro" color={colors.muted}>
        General guidance only — not personal medical advice.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surfaceCard,
    borderRadius: rounded.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});

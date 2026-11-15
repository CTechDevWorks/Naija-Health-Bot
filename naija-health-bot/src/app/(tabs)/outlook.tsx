import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/appText';
import { Screen } from '@/components/ui/screen';
import { colors, rounded, spacing } from '@/constants/theme';

export default function OutlookScreen() {
  return (
    <Screen>
      <AppText variant="displayMd">Outlook</AppText>
      <AppText variant="bodyMd" color={colors.body}>
        Explainability for the area-level malaria outlook will live here — what it
        means, what it does not mean, trends, factors, sources, and limitations.
      </AppText>

      <View style={styles.panel}>
        <AppText variant="headingMd">What this means</AppText>
        <AppText variant="bodySm" color={colors.muted}>
          Plain-language interpretation of the model estimate for your state.
        </AppText>
      </View>

      <View style={styles.panel}>
        <AppText variant="headingMd">What this does not mean</AppText>
        <AppText variant="bodySm" color={colors.muted}>
          Not a personal infection probability and not a diagnosis.
        </AppText>
      </View>

      <View style={styles.panel}>
        <AppText variant="headingMd">Trend</AppText>
        <AppText variant="bodySm" color={colors.muted}>
          Soft area-line chart + text summary will render once ML history is available.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surfaceCard,
    borderRadius: rounded.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});

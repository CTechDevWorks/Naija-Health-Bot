import { Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { AppText } from '@/components/ui/appText';
import { Screen } from '@/components/ui/screen';
import { colors, rounded, spacing } from '@/constants/theme';

/**
 * Home dashboard shell — sections match PM §22 / design §6.
 * Data wiring comes after the backend outlook endpoint exists.
 */
export default function HomeScreen() {
  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <AppText variant="caption" color={colors.muted}>
            Location
          </AppText>
          <AppText variant="headingMd">Choose your state</AppText>
          <AppText variant="caption" color={colors.muted}>
            GPS permission and outlook will connect here.
          </AppText>
        </View>
        <Link href="/settings" asChild>
          <Pressable hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
            <AppText variant="buttonSm" color={colors.secondary}>
              Settings
            </AppText>
          </Pressable>
        </Link>
      </View>

      <View style={styles.card}>
        <AppText variant="badge" color={colors.muted}>
          Health outlook
        </AppText>
        <AppText variant="bodyLg" style={styles.cardTitle}>
          Your area outlook will appear here.
        </AppText>
        <AppText variant="bodySm" color={colors.muted}>
          This describes your area, not your personal risk. 9ja Health provides
          information, not a diagnosis.
        </AppText>
      </View>

      <View style={styles.cardSoft}>
        <AppText variant="headingMd">Environment</AppText>
        <AppText variant="bodySm" color={colors.muted}>
          Temperature, humidity, rainfall, and wind will show once weather is connected.
        </AppText>
      </View>

      <View style={styles.card}>
        <AppText variant="headingMd">Prevention</AppText>
        <AppText variant="bodySm" color={colors.muted}>
          A few practical actions for this week will list here.
        </AppText>
      </View>

      <View style={styles.card}>
        <AppText variant="headingMd">Nigerian health update</AppText>
        <AppText variant="bodySm" color={colors.muted}>
          The daily report from the 06:30 backend job will preview here.
        </AppText>
      </View>

      <View style={styles.card}>
        <AppText variant="headingMd">Ask the assistant</AppText>
        <AppText variant="bodySm" color={colors.muted}>
          Open the Assistant tab for grounded health information with sources.
        </AppText>
      </View>

      <AppText variant="micro" color={colors.muted}>
        9ja Health provides health information and area-level estimates. It is not
        a diagnosis and does not replace a health professional.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: rounded.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardSoft: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    marginTop: spacing.xs,
  },
});

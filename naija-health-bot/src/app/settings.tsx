import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/appText';
import { Screen } from '@/components/ui/screen';
import { colors, rounded, spacing } from '@/constants/theme';

const ROWS = [
  'Location preference',
  'Manual state selection',
  'Notification preferences',
  'Health-report preferences',
  'Privacy',
  'Data sources',
  'Disclaimer',
  'About',
] as const;

export default function SettingsScreen() {
  return (
    <Screen>
      <AppText variant="bodyMd" color={colors.body}>
        MVP settings — no account required. Foreground location only; no continuous tracking.
      </AppText>

      {ROWS.map((row) => (
        <View key={row} style={styles.row}>
          <AppText variant="bodyStrong">{row}</AppText>
        </View>
      ))}

      <AppText variant="micro" color={colors.muted}>
        9ja Health provides health information and area-level estimates. It is not a
        diagnosis and does not replace a health professional.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    borderRadius: rounded.sm,
  },
});

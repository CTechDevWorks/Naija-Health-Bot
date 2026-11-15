import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/constants/theme';

type ScreenProps = ViewProps & {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
};

/**
 * Standard screen chrome: cream canvas, safe area, optional scroll.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  ...props
}: ScreenProps) {
  const contentStyle = [
    styles.content,
    padded && { paddingHorizontal: layout.gutterPhone },
    style,
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[contentStyle, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
          {...props}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]} {...props}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    maxWidth: layout.readingMax,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sectionLg,
    gap: spacing.xl,
  },
});

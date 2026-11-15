import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '@/constants/theme';

type AppTextVariant = keyof typeof typography;

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: string;
};

export function AppText({
  variant = 'bodyMd',
  color = colors.ink,
  style,
  ...props
}: AppTextProps) {
  const variantStyle = typography[variant] as TextStyle;
  return <Text {...props} style={[variantStyle, { color }, style]} />;
}

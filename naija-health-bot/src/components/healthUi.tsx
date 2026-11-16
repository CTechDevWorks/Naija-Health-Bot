import { PropsWithChildren, ReactElement, ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Href, router } from "expo-router";
import {
  layout,
  palette,
  radius,
  space,
  typography,
} from "@/constants/designTokens";
import { HealthIcon, IconName } from "./healthIcon";
import { useTextPreference } from "@/hooks/usePrototype";

export function AppText({
  variant = "body",
  tone = "ink",
  style,
  ...props
}: TextProps & {
  variant?: keyof typeof typography;
  tone?: "ink" | "body" | "forest" | "white" | "muted";
}) {
  const larger = useTextPreference();
  const scale = larger ? 1.15 : 1;
  return (
    <Text
      {...props}
      style={[
        typography[variant],
        {
          color: palette[tone],
          fontSize: typography[variant].fontSize * scale,
          lineHeight: typography[variant].lineHeight * scale,
        },
        style,
      ]}
    />
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  filled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        ui.iconButton,
        filled && ui.softGreen,
        pressed && ui.pressed,
      ]}
    >
      <HealthIcon name={icon} />
    </Pressable>
  );
}

export function Button({
  children,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  loading = false,
}: PropsWithChildren<{
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondaryButton,
        (disabled || loading) && ui.disabled,
        pressed && ui.pressed,
      ]}
    >
      <AppText variant="button" tone="forest">
        {children}
      </AppText>
      {loading ? (
        <ActivityIndicator color={palette.forest} />
      ) : icon ? (
        <HealthIcon name={icon} size={layout.smallIcon} />
      ) : null}
    </Pressable>
  );
}

export function Card({
  children,
  style,
  soft = false,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; soft?: boolean }>) {
  return <View style={[ui.card, soft && ui.softGreen, style]}>{children}</View>;
}
export function Badge({
  children,
  cream = false,
}: PropsWithChildren<{ cream?: boolean }>) {
  return (
    <View style={[ui.badge, cream && ui.cream]}>
      <AppText variant="eyebrow" tone="forest">
        {children}
      </AppText>
    </View>
  );
}
export function AppBrandHeader() {
  return (
    <View style={ui.brandHeader}>
      <View>
        <AppText variant="heading" tone="forest">
          9ja Health
          <AppText variant="heading" tone="forest">
            .
          </AppText>
        </AppText>
        <AppText variant="eyebrow" tone="body">
          WELLNESS, CLOSER TO HOME
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile and preferences"
        onPress={() => router.push("/profile")}
        style={ui.brandAvatar}
      >
        <AppText variant="subheading" tone="forest">
          •
        </AppText>
      </Pressable>
    </View>
  );
}

export function SectionHeading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={ui.sectionHeading}>
      <AppText variant="heading" style={ui.flex}>
        {title}
      </AppText>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={ui.textAction}
        >
          <AppText variant="label" tone="forest">
            {action}
          </AppText>
          <HealthIcon name="right" size={layout.smallIcon} />
        </Pressable>
      )}
    </View>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = false,
  backTo = "/",
  trailing,
  refreshControl,
  brandHeader = true,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  back?: boolean;
  /** Where the back button goes. Home unless a screen says otherwise. */
  backTo?: Href;
  trailing?: ReactNode;
  refreshControl?: ReactElement<typeof RefreshControl>;
  /** Shared 9ja Health header; off only for rare full-bleed layouts. */
  brandHeader?: boolean;
}>) {
  return (
    <ScrollView
      style={ui.flex}
      contentContainerStyle={ui.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {brandHeader ? <AppBrandHeader /> : null}
      {back ? (
        <View style={ui.pageHeader}>
          <IconButton
            icon="back"
            label={backTo === "/" ? "Back to Home" : "Back"}
            onPress={() => router.replace(backTo)}
          />
          {title ? (
            <View style={ui.flex}>
              <AppText variant="title" tone="forest">
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="small" tone="body">
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          ) : null}
          {trailing}
        </View>
      ) : title ? (
        <View style={ui.pageHeader}>
          <View style={ui.flex}>
            <AppText variant="title" tone="forest">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="small" tone="body">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {trailing}
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}
export function Disclaimer() {
  return (
    <View style={ui.disclaimer}>
      <HealthIcon name="shield" size={layout.smallIcon} />
      <AppText variant="caption" tone="body" style={ui.flex}>
        9ja Health provides health information and area-level estimates. It is
        not a diagnosis and does not replace a health professional.
      </AppText>
    </View>
  );
}
export function SearchField(props: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[ui.search, focused && ui.focused]}>
      <HealthIcon name="search" size={layout.smallIcon} />
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel || props.placeholder}
        placeholderTextColor={palette.body}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[typography.body, ui.flex, ui.input]}
      />
      {!!props.value && (
        <IconButton
          icon="close"
          label="Clear search"
          onPress={() => props.onChangeText?.("")}
        />
      )}
    </View>
  );
}
/** A labelled text box for forms. Shows `error` underneath when there is one. */
export function Field({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={ui.smallStack}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel || label}
        placeholderTextColor={palette.body}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[typography.body, ui.field, focused && ui.focused]}
      />
      {!!hint && !error && (
        <AppText variant="caption" tone="body">
          {hint}
        </AppText>
      )}
      {!!error && (
        <AppText variant="caption" accessibilityRole="alert">
          {error}
        </AppText>
      )}
    </View>
  );
}
export function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        ui.chip,
        active && ui.chipActive,
        pressed && ui.pressed,
      ]}
    >
      {active && (
        <HealthIcon
          name="check"
          size={layout.smallIcon}
          color={palette.white}
        />
      )}
      <AppText variant="button" tone={active ? "white" : "body"}>
        {label}
      </AppText>
    </Pressable>
  );
}
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title: string;
}>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={ui.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close dialog"
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[
            ui.sheet,
            { paddingBottom: Math.max(insets.bottom, space.xl) },
          ]}
        >
          <View style={ui.sectionHeading}>
            <AppText variant="heading" style={ui.flex}>
              {title}
            </AppText>
            <IconButton icon="close" label="Close dialog" onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={ui.sheetContent}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function RowLink({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <View style={ui.rowIcon}>
        <HealthIcon name={icon} size={layout.smallIcon} />
      </View>
      <View style={ui.flex}>
        <AppText variant="button">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" tone="body">
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing || <HealthIcon name="chevron" size={layout.smallIcon} />}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [ui.rowLink, pressed && ui.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={ui.rowLink}>{content}</View>
  );
}
export function SourceLink({ title, url }: { title: string; url: string }) {
  const [error, setError] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="link"
        onPress={() => Linking.openURL(url).catch(() => setError(true))}
        style={ui.textAction}
      >
        <HealthIcon name="book" size={layout.smallIcon} />
        <AppText variant="caption" tone="forest" style={ui.flex}>
          {title}
        </AppText>
        <HealthIcon name="external" size={layout.smallIcon} />
      </Pressable>
      {error && (
        <AppText variant="caption">
          Could not open the source. Please try again.
        </AppText>
      )}
    </View>
  );
}
export const ui = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  stack: { gap: space.lg },
  smallStack: { gap: space.sm },
  screen: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.xxl,
    gap: space.xl,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: space.lg,
    borderBottomWidth: layout.line,
    borderColor: palette.line,
  },
  brandAvatar: {
    width: layout.avatar,
    height: layout.avatar,
    borderRadius: radius.pill,
    backgroundColor: palette.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginBottom: space.sm,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  iconButton: {
    width: layout.touch,
    height: layout.touch,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  button: {
    minHeight: layout.touch,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: palette.transparent,
    borderWidth: layout.line,
    borderColor: palette.forest,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.45 },
  card: {
    backgroundColor: palette.white,
    borderWidth: layout.line,
    borderColor: palette.line,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  softGreen: { backgroundColor: palette.softGreen },
  cream: { backgroundColor: palette.cream },
  badge: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.softGreen,
    alignSelf: "flex-start",
  },
  textAction: {
    minHeight: layout.touch,
    flexDirection: "row",
    gap: space.sm,
    alignItems: "center",
  },
  disclaimer: {
    flexDirection: "row",
    gap: space.md,
    backgroundColor: palette.softGreen,
    padding: space.lg,
    borderRadius: radius.md,
    alignItems: "flex-start",
  },
  search: {
    borderRadius: radius.pill,
    borderWidth: layout.line,
    borderColor: palette.line,
    paddingLeft: space.lg,
    paddingRight: space.sm,
    minHeight: layout.touch,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.white,
  },
  focused: { borderColor: palette.forest },
  input: { paddingVertical: space.md, minWidth: 0 },
  field: {
    minHeight: layout.touch,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: layout.line,
    borderColor: palette.line,
    backgroundColor: palette.white,
  },
  chip: {
    minHeight: layout.touch,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    borderWidth: layout.line,
    borderColor: palette.line,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  chipActive: { backgroundColor: palette.forest, borderColor: palette.forest },
  modalBackdrop: {
    flex: 1,
    backgroundColor: palette.scrim,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: space.section,
  },
  sheet: {
    backgroundColor: palette.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    width: "100%",
    maxWidth: layout.reading,
    maxHeight: "90%",
  },
  sheetContent: { gap: space.lg, paddingTop: space.lg },
  rowLink: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: layout.touch,
    gap: space.md,
    paddingVertical: space.md,
  },
  rowIcon: {
    width: layout.avatar,
    height: layout.avatar,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: palette.softGreen,
  },
  separator: { height: layout.line, backgroundColor: palette.line },
});

import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { states } from "@/constants/healthContent";
import { palette } from "@/constants/designTokens";
import { useEnvironment } from "@/hooks/useEnvironment";
import { AppText, Button, SearchField, Sheet, ui } from "./healthUi";
import { HealthIcon } from "./healthIcon";

export function LocationPicker({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { state, source, status, refreshFromGps, setManualState, message } =
    useEnvironment();
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const matching = states.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase().trim()),
  );

  async function useGps() {
    setSaving(true);
    try {
      await refreshFromGps();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function chooseState(item: string) {
    setSaving(true);
    try {
      await setManualState(item);
      setQuery("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={visible} title="Your location" onClose={onClose}>
      <AppText tone="body">
        9ja Health uses foreground location once to find your Nigerian state and
        local weather. You can always choose a state manually instead.
      </AppText>

      <Button
        icon="pin"
        loading={saving && status === "loading"}
        disabled={saving}
        onPress={() => void useGps()}
      >
        Use my current location
      </Button>

      {message ? (
        <AppText variant="caption" tone="body">
          {message}
        </AppText>
      ) : null}

      {state ? (
        <AppText variant="caption" tone="body">
          Current: {state}
          {source === "gps" ? " · GPS" : source === "manual" ? " · Manual" : ""}
        </AppText>
      ) : null}

      <SearchField
        placeholder="Search Nigerian states"
        value={query}
        onChangeText={setQuery}
      />

      {saving && status === "loading" ? (
        <ActivityIndicator color={palette.forest} />
      ) : null}

      {matching.length === 0 && (
        <AppText>No states match your search. Try another name.</AppText>
      )}
      {matching.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="radio"
          accessibilityState={{ checked: state === item }}
          disabled={saving}
          onPress={() => void chooseState(item)}
          style={ui.rowLink}
        >
          <HealthIcon name="pin" />
          <View style={ui.flex}>
            <AppText variant="button">{item}</AppText>
          </View>
          {state === item && <HealthIcon name="check" />}
        </Pressable>
      ))}
    </Sheet>
  );
}

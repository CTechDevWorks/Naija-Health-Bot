import { useState } from "react";
import { Pressable, View } from "react-native";
import { states } from "@/constants/healthContent";
import { usePrototype } from "@/hooks/usePrototype";
import { AppText, SearchField, Sheet, ui } from "./healthUi";
import { HealthIcon } from "./healthIcon";

export function LocationPicker({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { state, setState } = usePrototype();
  const [query, setQuery] = useState("");
  const matching = states.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase().trim()),
  );
  return (
    <Sheet visible={visible} title="Choose your state" onClose={onClose}>
      <AppText tone="body">
        Your area helps put health information in context. This prototype uses
        manual selection only and never accesses your GPS.
      </AppText>
      <SearchField
        placeholder="Search Nigerian states"
        value={query}
        onChangeText={setQuery}
      />
      <AppText variant="caption" tone="body">
        Selection is kept for this session. Live outlook and weather are not
        connected.
      </AppText>
      {matching.length === 0 && (
        <AppText>No states match your search. Try another name.</AppText>
      )}
      {matching.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="radio"
          accessibilityState={{ checked: state === item }}
          onPress={() => {
            setState(item);
            setQuery("");
            onClose();
          }}
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

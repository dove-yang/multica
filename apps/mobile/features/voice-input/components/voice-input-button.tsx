import { Ionicons } from "@expo/vector-icons";
import type { GestureResponderHandlers } from "react-native";
import { View } from "react-native";
import { useColorScheme } from "@/lib/use-color-scheme";
import { THEME } from "@/lib/theme";

interface Props {
  enabled: boolean;
  recording: boolean;
  panHandlers: GestureResponderHandlers;
  /** VoiceOver activates this instead of "hold". */
  onToggle: () => void;
  label: string;
  hint: string;
}

/**
 * The mic affordance that lives in the composer toolbar. It stays mounted
 * for the whole recording session (the PanResponder owns the touch), so the
 * parent must never unmount it while `recording` is true.
 */
export function VoiceInputButton({
  enabled,
  recording,
  panHandlers,
  onToggle,
  label,
  hint,
}: Props) {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme];

  return (
    <View
      {...panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !enabled, busy: recording }}
      onAccessibilityTap={onToggle}
      style={{
        width: 44,
        height: 44,
        marginHorizontal: -6,
        marginVertical: -6,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={recording ? "mic" : "mic-outline"}
        size={20}
        color={recording ? theme.destructive : theme.foreground}
      />
    </View>
  );
}

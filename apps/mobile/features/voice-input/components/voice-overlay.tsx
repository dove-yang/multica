import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/lib/use-color-scheme";
import { THEME } from "@/lib/theme";

export type VoiceOverlayMode = "hidden" | "hint" | "cancel" | "notice";

interface Props {
  mode: VoiceOverlayMode;
  hintText: string;
  cancelText: string;
  noticeText?: string | null;
}

/**
 * Floating feedback above the composer:
 *   hint   — "↑ slide up to cancel" while listening
 *   cancel — the armed, red "release to cancel" capsule
 *   notice — short-lived errors / confirmations
 */
export function VoiceOverlay({
  mode,
  hintText,
  cancelText,
  noticeText,
}: Props) {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme];
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode !== "cancel") return;
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 180,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode, opacity, scale]);

  if (mode === "hidden") return null;

  return (
    <View
      pointerEvents="none"
      className="h-11 items-center justify-center"
    >
      {mode === "cancel" ? (
        <Animated.View
          style={{
            transform: [{ scale }],
            opacity,
            backgroundColor: theme.destructive,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
          className="h-11 flex-row items-center gap-2 rounded-full px-5"
        >
          <Ionicons name="trash-outline" size={18} color="#ffffff" />
          <Text className="text-[15px] font-semibold text-white">
            {cancelText}
          </Text>
        </Animated.View>
      ) : (
        <View
          className="flex-row items-center rounded-full border px-3.5 py-1.5"
          style={
            mode === "hint"
              ? {
                  // DeepSeek-style dark voice HUD; fixed so it reads the same
                  // in both themes instead of inverting with the palette.
                  backgroundColor: "#1C1C1E",
                  borderColor: "rgba(255,255,255,0.14)",
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }
              : undefined
          }
        >
          <Text
            className={
              mode === "hint"
                ? "text-xs text-white"
                : "text-xs text-muted-foreground"
            }
          >
            {mode === "hint" ? `↑ ${hintText}` : noticeText}
          </Text>
        </View>
      )}
    </View>
  );
}

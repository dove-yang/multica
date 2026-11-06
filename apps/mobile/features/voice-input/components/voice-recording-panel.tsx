import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useT } from "@/lib/i18n";
import { useColorScheme } from "@/lib/use-color-scheme";
import { THEME } from "@/lib/theme";
import { VoiceWaveform } from "./voice-waveform";

interface Props {
  text: string;
  volume: number;
  armed: boolean;
  transcribing: boolean;
  /** Compact layout for the collapsed composer bar. */
  compact?: boolean;
}

/**
 * The recording face of the composer, DeepSeek-style: it replaces the input
 * content in place instead of floating a separate overlay above it.
 */
export function VoiceRecordingPanel({
  text,
  volume,
  armed,
  transcribing,
  compact = false,
}: Props) {
  const { t } = useT("voiceInput");
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme];

  const status = String(
    transcribing
      ? t("transcribing")
      : armed
        ? t("recording.release_to_cancel")
        : t("recording.release_to_finish"),
  );

  return (
    <View className={compact ? "gap-1 px-4 py-2" : "gap-2 px-4 pt-3 pb-2"}>
      <Text
        numberOfLines={compact ? 1 : 3}
        className={
          text && !transcribing
            ? "text-base text-foreground"
            : "text-base text-muted-foreground"
        }
      >
        {text || (transcribing ? t("transcribing") : t("listening"))}
      </Text>

      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          {transcribing ? (
            <ActivityIndicator size="small" color={theme.mutedForeground} />
          ) : (
            <VoiceWaveform
              level={volume}
              color={armed ? theme.destructive : theme.foreground}
            />
          )}
        </View>
        <View className="flex-row items-center gap-1">
          {armed && !transcribing ? (
            <Ionicons
              name="arrow-up-circle"
              size={16}
              color={theme.destructive}
            />
          ) : null}
          <Text
            className={
              armed && !transcribing
                ? "text-[13px] font-semibold"
                : "text-[13px] text-muted-foreground"
            }
            style={armed && !transcribing ? { color: theme.destructive } : undefined}
            numberOfLines={1}
          >
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

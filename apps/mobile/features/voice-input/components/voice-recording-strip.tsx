import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useT } from "@/lib/i18n";
import { useColorScheme } from "@/lib/use-color-scheme";
import { THEME } from "@/lib/theme";
import { formatDuration } from "../lib/format-duration";
import { VoiceWaveform } from "./voice-waveform";

interface Props {
  durationMs: number;
  volume: number;
  armed: boolean;
  transcribing: boolean;
}

/** Timer + live meter that replaces the toolbar's leading actions. */
export function VoiceRecordingStrip({
  durationMs,
  volume,
  armed,
  transcribing,
}: Props) {
  const { t } = useT("voiceInput");
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme];

  if (transcribing) {
    return (
      <View className="flex-1 flex-row items-center gap-2 px-1">
        <ActivityIndicator size="small" color={theme.mutedForeground} />
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {t("transcribing")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row items-center gap-2 px-1">
      <View className="flex-row items-center gap-1.5">
        <View className="h-2 w-2 rounded-full bg-destructive" />
        <Text
          className="text-[13px] font-semibold text-foreground"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatDuration(durationMs)}
        </Text>
      </View>
      <View className="flex-1 items-center">
        <VoiceWaveform
          level={volume}
          color={armed ? theme.destructive : theme.foreground}
        />
      </View>
      <Text
        className="text-[11px] text-muted-foreground"
        numberOfLines={1}
      >
        {armed ? t("recording.release_to_cancel") : t("recording.release_to_finish")}
      </Text>
    </View>
  );
}

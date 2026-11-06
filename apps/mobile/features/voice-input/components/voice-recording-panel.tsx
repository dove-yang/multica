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

      {/* The waveform is centred on the card itself, not on the space left
       *  over by the status label — otherwise it drifts left whenever the
       *  label ("松手结束" / "松开取消") changes width. */}
      <View className="justify-center" style={{ height: 26 }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {transcribing ? (
            <ActivityIndicator size="small" color={theme.mutedForeground} />
          ) : (
            <VoiceWaveform
              level={volume}
              color={armed ? theme.destructive : theme.foreground}
            />
          )}
        </View>
        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
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

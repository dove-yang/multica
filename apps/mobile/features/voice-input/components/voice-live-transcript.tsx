import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { useT } from "@/lib/i18n";

interface Props {
  text: string;
  transcribing: boolean;
}

/** Takes the TextInput's place while dictation owns the composer. */
export function VoiceLiveTranscript({ text, transcribing }: Props) {
  const { t } = useT("voiceInput");
  const body = text || (transcribing ? t("transcribing") : t("listening"));
  return (
    <View className="px-4 pt-3 pb-1" style={{ minHeight: 28, maxHeight: 140 }}>
      <Text
        numberOfLines={4}
        className={
          text && !transcribing
            ? "text-base text-foreground"
            : "text-base text-muted-foreground"
        }
      >
        {body}
      </Text>
    </View>
  );
}

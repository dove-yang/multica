import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useT } from "@/lib/i18n";
import { useColorScheme } from "@/lib/use-color-scheme";
import { THEME } from "@/lib/theme";
import type { PermissionSheet } from "../types";

interface Props {
  sheet: PermissionSheet;
  onConfirm: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

/**
 * Shown before the system microphone prompt (once) and again after a
 * denial, where the only way forward is Settings.
 */
export function VoicePermissionSheet({
  sheet,
  onConfirm,
  onOpenSettings,
  onDismiss,
}: Props) {
  const { t } = useT("voiceInput");
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme];
  const denied = sheet === "denied";

  return (
    <Modal
      visible={sheet !== null}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <View className="rounded-t-3xl bg-background px-6 pb-10 pt-3">
          <View className="mb-5 h-1 w-9 self-center rounded-full bg-border" />
          <View className="mb-4 h-14 w-14 items-center justify-center self-center rounded-2xl bg-secondary">
            <Ionicons name="mic-outline" size={26} color={theme.foreground} />
          </View>
          <Text className="text-center text-lg font-semibold text-foreground">
            {denied ? t("permission.denied_title") : t("permission.title")}
          </Text>
          <Text className="mb-6 mt-2 text-center text-[13px] leading-5 text-muted-foreground">
            {denied ? t("permission.denied_body") : t("permission.body")}
          </Text>

          <Pressable
            onPress={denied ? onOpenSettings : onConfirm}
            className="h-12 items-center justify-center rounded-xl bg-primary active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="font-semibold text-primary-foreground">
              {denied ? t("permission.open_settings") : t("permission.continue")}
            </Text>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            className="mt-2 h-11 items-center justify-center active:opacity-70"
            accessibilityRole="button"
          >
            <Text className="text-muted-foreground">
              {denied ? t("permission.ok") : t("permission.not_now")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

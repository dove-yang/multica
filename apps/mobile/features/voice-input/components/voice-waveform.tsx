import { View } from "react-native";

/** Fixed weights keep the meter looking like a waveform, not noise. */
const BAR_WEIGHTS = [
  0.32, 0.55, 0.78, 1, 0.66, 0.42, 0.86, 0.58, 0.36, 0.72, 0.95, 0.5, 0.3, 0.62,
  0.84, 0.46, 0.34, 0.7, 0.9, 0.56, 0.38, 0.76,
];

interface Props {
  /** 0..1 input level. */
  level: number;
  color: string;
  barCount?: number;
}

export function VoiceWaveform({ level, color, barCount = 22 }: Props) {
  const scale = 0.28 + Math.min(1, Math.max(0, level)) * 0.72;
  return (
    <View className="h-6 flex-row items-center justify-center gap-[3px]">
      {BAR_WEIGHTS.slice(0, barCount).map((weight, index) => (
        <View
          key={index}
          style={{
            width: 3,
            height: Math.max(3, Math.round(24 * weight * scale)),
            borderRadius: 2,
            backgroundColor: color,
            opacity: 0.9,
          }}
        />
      ))}
    </View>
  );
}

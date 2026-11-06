import { useEffect, useState } from "react";
import { View } from "react-native";

const DEFAULT_BARS = 25;
const MAX_HEIGHT = 26;
const TICK_MS = 90;

interface Props {
  /** 0..1 input level from the recognizer. */
  level: number;
  color: string;
  barCount?: number;
}

/**
 * Symmetric voice meter: bar heights mirror around the centre bar, so the
 * silhouette is the same left-to-right, and each bar is vertically centred
 * on the same axis. A slow phase keeps it breathing between volume events.
 */
export function VoiceWaveform({ level, color, barCount = DEFAULT_BARS }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase((p) => p + 0.38), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Odd count guarantees a single centre bar to mirror around.
  const count = Math.max(5, barCount % 2 === 0 ? barCount + 1 : barCount);
  const half = (count - 1) / 2;
  const live = 0.35 + Math.min(1, Math.max(0, level)) * 0.65;

  return (
    <View className="h-6 flex-row items-center justify-center gap-[3px]">
      {Array.from({ length: count }, (_, index) => {
        // 0 at the centre bar, 1 at both edges — mirrored by construction.
        const distance = Math.abs(index - half) / half;
        const envelope = 1 - Math.pow(distance, 1.4) * 0.55;
        const wave = 0.25 + 0.75 * Math.abs(Math.sin(phase + distance * 7.5));
        const height = Math.max(
          3,
          Math.round(MAX_HEIGHT * envelope * wave * live),
        );
        return (
          <View
            key={index}
            style={{
              width: 3,
              height,
              borderRadius: 2,
              backgroundColor: color,
              opacity: 0.9,
            }}
          />
        );
      })}
    </View>
  );
}

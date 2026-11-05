/**
 * expo-speech-recognition reports volume in dBFS-ish units from -2 (silent)
 * to 10 (loud). The UI wants 0..1 for bar heights.
 */
export function toAmplitude(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = (value + 2) / 12;
  return Math.min(1, Math.max(0, normalized));
}

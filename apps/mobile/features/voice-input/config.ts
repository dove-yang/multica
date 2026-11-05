/**
 * Voice input tuning. Every product-facing number lives here so the
 * interaction can be re-tuned without touching the state machine.
 */
export const VOICE_INPUT_CONFIG = {
  /** Slide distance (pt, upward) that arms "release to cancel". */
  cancelThresholdPt: 64,
  /** Shorter than this is treated as an accidental tap. */
  minDurationMs: 600,
  /** Apple's recognizer caps a single utterance at ~1 minute. */
  maxDurationMs: 60_000,
  /** How often the native side reports input level. */
  meterIntervalMs: 80,
  /** Fallback wait for a final transcript after `stop()`. */
  commitTimeoutMs: 2_500,
} as const;

/** Map the app locale to an Apple Speech locale identifier. */
export function resolveSpeechLang(locale: string): string {
  return locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

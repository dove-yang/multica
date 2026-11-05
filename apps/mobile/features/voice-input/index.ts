/**
 * Voice input — a self-contained vertical slice.
 *
 * Everything this feature owns lives in this folder; the composer only
 * wires six exports together. See README.md for the integration points,
 * state machine, and how to remove the feature in one step.
 */
export { useVoiceInput } from "./hooks/use-voice-input";
export { VoiceInputButton } from "./components/voice-input-button";
export { VoiceLiveTranscript } from "./components/voice-live-transcript";
export { VoiceRecordingStrip } from "./components/voice-recording-strip";
export { VoiceOverlay } from "./components/voice-overlay";
export type { VoiceOverlayMode } from "./components/voice-overlay";
export { VoicePermissionSheet } from "./components/voice-permission-sheet";
export { VOICE_INPUT_CONFIG } from "./config";
export type {
  InsertResult,
  PermissionSheet,
  TextSelection,
  VoiceDraft,
  VoiceInputStatus,
  VoiceNotice,
} from "./types";

export type VoiceInputStatus =
  | "idle"
  | "starting"
  | "recording"
  | "armed"
  | "transcribing";

/** Inline explanations shown before/after the system microphone prompt. */
export type PermissionSheet = "explain" | "denied" | null;

/** Transient feedback shown above the composer. */
export type VoiceNotice =
  | "too_short"
  | "empty"
  | "error"
  | "cancelled"
  | "max_duration"
  | "permission_granted"
  | null;

export interface TextSelection {
  start: number;
  end: number;
}

export interface InsertResult {
  text: string;
  cursor: number;
}

export interface VoiceDraft {
  text: string;
  selection: TextSelection | null;
}

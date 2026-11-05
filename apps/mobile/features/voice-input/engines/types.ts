/**
 * The one seam between the UI/state machine and whatever turns speech into
 * text. v1 is Apple's on-device/online dictation; a server-side Whisper
 * engine can be dropped in here later without touching the components.
 */
export interface SpeechPermission {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
  restricted?: boolean;
}

export interface SpeechEngineHandlers {
  onPartial: (transcript: string) => void;
  onFinal: (transcript: string) => void;
  /** Normalised 0..1 input level. */
  onVolume: (level: number) => void;
  onError: (code: string, message: string) => void;
  onEnd: () => void;
}

export interface SpeechEngine {
  start: (lang: string) => void;
  stop: () => void;
  abort: () => void;
  getPermission: () => Promise<SpeechPermission>;
  requestPermission: () => Promise<SpeechPermission>;
}

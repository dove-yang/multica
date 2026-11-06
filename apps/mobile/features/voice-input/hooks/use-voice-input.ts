import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocale } from "@/lib/i18n";
import { VOICE_INPUT_CONFIG, resolveSpeechLang } from "../config";
import { useAppleSpeechEngine } from "../engines/apple-speech";
import { insertTranscript } from "../lib/insert-transcript";
import type {
  InsertResult,
  PermissionSheet,
  VoiceDraft,
  VoiceInputStatus,
  VoiceNotice,
} from "../types";
import { useHoldToTalk } from "./use-hold-to-talk";

interface UseVoiceInputOptions {
  enabled?: boolean;
  /** Read the draft at commit time so the hook never captures stale text. */
  getDraft: () => VoiceDraft;
  /** Composer is about to start listening (dismiss the keyboard here). */
  onStart?: () => void;
  /** Transcript should be written into the composer. */
  onFinish?: (result: InsertResult) => void;
  /** Cancel explicitly clears the composer (product decision). */
  onCancel?: () => void;
  /** A short tap on the collapsed pill (expand + focus, like before). */
  onTapComposer?: () => void;
}

/** Keep cumulative iOS finals from duplicating text when they overlap. */
function mergeFinal(previous: string, next: string): string {
  if (!previous) return next;
  if (next.startsWith(previous)) return next;
  if (previous.startsWith(next)) return previous;
  const separator = /[\s，。！？；：、]$/.test(previous) ? "" : " ";
  return `${previous}${separator}${next}`;
}

export function useVoiceInput({
  enabled = true,
  getDraft,
  onStart,
  onFinish,
  onCancel,
  onTapComposer,
}: UseVoiceInputOptions) {
  const locale = useLocale();
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [partialText, setPartialText] = useState("");
  const [volume, setVolume] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [notice, setNotice] = useState<VoiceNotice>(null);
  const [permissionSheet, setPermissionSheet] = useState<PermissionSheet>(null);

  const statusRef = useRef<VoiceInputStatus>("idle");
  const updateStatus = useCallback((next: VoiceInputStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const finalRef = useRef("");
  const partialRef = useRef("");
  const startedAtRef = useRef(0);
  const pressingRef = useRef(false);
  const committingRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitNowRef = useRef<() => void>(() => {});
  const finishRef = useRef<(cancelled: boolean) => void>(() => {});
  const startRecordingRef = useRef<() => void>(() => {});

  // Latest callbacks, without re-creating the state machine on every render.
  const optionsRef = useRef({
    getDraft,
    onStart,
    onFinish,
    onCancel,
    onTapComposer,
  });
  optionsRef.current = {
    getDraft,
    onStart,
    onFinish,
    onCancel,
    onTapComposer,
  };

  const showNotice = useCallback((next: Exclude<VoiceNotice, null>) => {
    setNotice(next);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2_600);
  }, []);

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearTimers();
    finalRef.current = "";
    partialRef.current = "";
    committingRef.current = false;
    setPartialText("");
    setVolume(0);
    setDurationMs(0);
    updateStatus("idle");
  }, [clearTimers, updateStatus]);

  const commitNow = useCallback(() => {
    if (committingRef.current) return;
    if (statusRef.current !== "transcribing") return;
    committingRef.current = true;
    clearTimers();

    // iOS returns cumulative partials but can also emit per-segment finals.
    // The longer string is the one that has seen the most speech.
    const finalText = finalRef.current.trim();
    const partialText = partialRef.current.trim();
    const transcript =
      finalText.length >= partialText.length ? finalText : partialText;
    if (!transcript) {
      committingRef.current = false;
      setPartialText("");
      setVolume(0);
      setDurationMs(0);
      updateStatus("idle");
      showNotice("empty");
      return;
    }

    const draft = optionsRef.current.getDraft();
    const result = insertTranscript(draft.text, transcript, draft.selection);

    updateStatus("idle");
    setPartialText("");
    setVolume(0);
    setDurationMs(0);
    finalRef.current = "";
    partialRef.current = "";
    optionsRef.current.onFinish?.(result);
    committingRef.current = false;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  }, [clearTimers, showNotice, updateStatus]);
  commitNowRef.current = commitNow;

  const engine = useAppleSpeechEngine({
    onPartial: (transcript) => {
      if (
        statusRef.current !== "recording" &&
        statusRef.current !== "armed"
      ) {
        return;
      }
      partialRef.current = transcript;
      setPartialText(transcript);
    },
    onFinal: (transcript) => {
      finalRef.current = mergeFinal(finalRef.current, transcript);
      if (statusRef.current === "transcribing") commitNowRef.current();
    },
    onVolume: (level) => {
      if (
        statusRef.current === "recording" ||
        statusRef.current === "armed"
      ) {
        setVolume(level);
      }
    },
    onError: (code) => {
      if (code === "aborted") return;
      if (
        statusRef.current !== "recording" &&
        statusRef.current !== "armed" &&
        statusRef.current !== "transcribing"
      ) {
        return;
      }
      resetSession();
      showNotice(code === "no-speech" ? "empty" : "error");
    },
    onEnd: () => {
      if (statusRef.current === "transcribing") commitNowRef.current();
    },
  });

  const finish = useCallback(
    (cancelled: boolean) => {
      const current = statusRef.current;
      if (current !== "recording" && current !== "armed") return;
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      const elapsed = Date.now() - startedAtRef.current;

      if (cancelled) {
        engine.abort();
        resetSession();
        optionsRef.current.onCancel?.();
        showNotice("cancelled");
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        ).catch(() => {});
        return;
      }

      if (elapsed < VOICE_INPUT_CONFIG.minDurationMs) {
        engine.abort();
        resetSession();
        showNotice("too_short");
        return;
      }

      setDurationMs(elapsed);
      updateStatus("transcribing");
      engine.stop();
      commitTimerRef.current = setTimeout(
        () => commitNowRef.current(),
        VOICE_INPUT_CONFIG.commitTimeoutMs,
      );
    },
    [engine, resetSession, showNotice, updateStatus],
  );
  finishRef.current = finish;

  const startRecording = useCallback(() => {
    finalRef.current = "";
    partialRef.current = "";
    committingRef.current = false;
    setPartialText("");
    setVolume(0);
    setDurationMs(0);
    startedAtRef.current = Date.now();
    updateStatus("recording");
    optionsRef.current.onStart?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      engine.start(resolveSpeechLang(locale));
    } catch {
      resetSession();
      showNotice("error");
      return;
    }

    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setDurationMs(elapsed);
      if (elapsed >= VOICE_INPUT_CONFIG.maxDurationMs) {
        showNotice("max_duration");
        finishRef.current(false);
      }
    }, 100);
  }, [engine, locale, resetSession, showNotice, updateStatus]);
  startRecordingRef.current = startRecording;

  const begin = useCallback(
    async (mode: "hold" | "toggle") => {
      if (statusRef.current !== "idle") return;
      updateStatus("starting");

      let permission;
      try {
        permission = await engine.getPermission();
      } catch {
        permission = { granted: false, status: "denied", canAskAgain: false };
      }

      if (!permission.granted) {
        updateStatus("idle");
        setPermissionSheet(
          permission.status === "undetermined" && permission.canAskAgain
            ? "explain"
            : "denied",
        );
        return;
      }

      // A press-and-hold gesture may already be over by the time the
      // permission check resolves; starting then would record forever.
      if (mode === "hold" && !pressingRef.current) {
        updateStatus("idle");
        return;
      }

      startRecordingRef.current();
    },
    [engine, updateStatus],
  );

  const confirmPermission = useCallback(async () => {
    const permission = await engine.requestPermission();
    if (permission.granted) {
      setPermissionSheet(null);
      showNotice("permission_granted");
      return;
    }
    setPermissionSheet("denied");
  }, [engine, showNotice]);

  const dismissPermission = useCallback(() => setPermissionSheet(null), []);

  const openSettings = useCallback(() => {
    setPermissionSheet(null);
    void Linking.openSettings();
  }, []);

  const toggleHandsFree = useCallback(() => {
    if (statusRef.current === "idle") {
      void begin("toggle");
      return;
    }
    if (
      statusRef.current === "recording" ||
      statusRef.current === "armed"
    ) {
      finishRef.current(false);
    }
  }, [begin]);

  const pressStart = useCallback(() => {
    pressingRef.current = true;
    void begin("hold");
  }, [begin]);

  const pressMove = useCallback((dy: number) => {
    if (
      statusRef.current !== "recording" &&
      statusRef.current !== "armed"
    ) {
      return;
    }
    const armed = dy <= -VOICE_INPUT_CONFIG.cancelThresholdPt;
    const isArmed = statusRef.current === "armed";
    if (armed === isArmed) return;
    if (armed) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
    updateStatus(armed ? "armed" : "recording");
  }, [updateStatus]);

  const pressEnd = useCallback((dy: number, cancelled: boolean) => {
    pressingRef.current = false;
    if (cancelled) {
      finishRef.current(true);
      return;
    }
    finishRef.current(dy <= -VOICE_INPUT_CONFIG.cancelThresholdPt);
  }, []);

  const panHandlers = useHoldToTalk({
    enabled: enabled && status === "idle",
    onStart: pressStart,
    onMove: pressMove,
    onEnd: pressEnd,
  });

  // Same gesture on the collapsed pill: a short tap expands the composer,
  // holding it starts dictation in place (DeepSeek-style "按住说话").
  const pillPanHandlers = useHoldToTalk({
    enabled: enabled && status === "idle",
    delayMs: 200,
    onStart: pressStart,
    onMove: pressMove,
    onEnd: pressEnd,
    onTap: () => optionsRef.current.onTapComposer?.(),
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      // "inactive" also fires for Control Center / notification shade; only
      // a real background transition should drop the take.
      if (next !== "background") return;
      if (
        statusRef.current === "recording" ||
        statusRef.current === "armed"
      ) {
        finishRef.current(true);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(
    () => () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      engine.abort();
    },
    [engine],
  );

  return {
    status,
    isRecording: status === "recording" || status === "armed",
    isArmed: status === "armed",
    isTranscribing: status === "transcribing",
    isActive: status === "recording" || status === "armed" || status === "transcribing",
    partialText,
    volume,
    durationMs,
    notice,
    permissionSheet,
    panHandlers,
    pillPanHandlers,
    confirmPermission,
    dismissPermission,
    openSettings,
    toggleHandsFree,
    cancel: () => finishRef.current(true),
    start: () => void begin("toggle"),
  };
}

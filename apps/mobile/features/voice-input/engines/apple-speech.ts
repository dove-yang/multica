/**
 * Apple Speech adapter (expo-speech-recognition).
 *
 * The native module is event-driven; this hook wires its events into a
 * stable `SpeechEngine` object. Handlers are read through a ref so callers
 * can pass fresh closures every render without re-subscribing.
 */
import { useCallback, useMemo, useRef } from "react";
import {
  AVAudioSessionCategory,
  AVAudioSessionCategoryOptions,
  AVAudioSessionMode,
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { VOICE_INPUT_CONFIG } from "../config";
import { toAmplitude } from "../lib/amplitude";
import type { SpeechEngine, SpeechEngineHandlers } from "./types";

export function useAppleSpeechEngine(
  handlers: SpeechEngineHandlers,
): SpeechEngine {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    if (!transcript) return;
    if (event.isFinal) handlersRef.current.onFinal(transcript);
    else handlersRef.current.onPartial(transcript);
  });

  useSpeechRecognitionEvent("volumechange", (event) => {
    handlersRef.current.onVolume(toAmplitude(event.value));
  });

  useSpeechRecognitionEvent("error", (event) => {
    handlersRef.current.onError(event.error, event.message);
  });

  useSpeechRecognitionEvent("end", () => {
    handlersRef.current.onEnd();
  });

  const start = useCallback((lang: string) => {
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      // iOS 18+: keep listening until the request ends instead of stopping
      // after the first pause.
      continuous: true,
      addsPunctuation: true,
      // Online dictation by default (better punctuation/proper nouns);
      // the recognizer falls back to the on-device model when offline.
      requiresOnDeviceRecognition: false,
      iosTaskHint: "dictation",
      iosCategory: {
        category: AVAudioSessionCategory.playAndRecord,
        categoryOptions: [AVAudioSessionCategoryOptions.allowBluetooth],
        mode: AVAudioSessionMode.measurement,
      },
      volumeChangeEventOptions: {
        enabled: true,
        intervalMillis: VOICE_INPUT_CONFIG.meterIntervalMs,
      },
    });
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const abort = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
  }, []);

  const getPermission = useCallback(
    () => ExpoSpeechRecognitionModule.getPermissionsAsync(),
    [],
  );

  const requestPermission = useCallback(
    () => ExpoSpeechRecognitionModule.requestPermissionsAsync(),
    [],
  );

  return useMemo(
    () => ({ start, stop, abort, getPermission, requestPermission }),
    [start, stop, abort, getPermission, requestPermission],
  );
}

import { useMemo, useRef } from "react";
import { PanResponder, type GestureResponderHandlers } from "react-native";

interface HoldToTalkOptions {
  enabled: boolean;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: (dy: number, cancelled: boolean) => void;
}

/**
 * Press-and-hold gesture for the mic button.
 *
 * PanResponder (not Pressable) because the finger routinely leaves the
 * button bounds while sliding up to cancel — Pressable cancels the press
 * when that happens, PanResponder keeps the responder until release.
 */
export function useHoldToTalk({
  enabled,
  onStart,
  onMove,
  onEnd,
}: HoldToTalkOptions): GestureResponderHandlers {
  const ref = useRef({ enabled, onStart, onMove, onEnd });
  ref.current = { enabled, onStart, onMove, onEnd };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => ref.current.enabled,
        onMoveShouldSetPanResponder: () => ref.current.enabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => ref.current.onStart(),
        onPanResponderMove: (_event, gesture) => ref.current.onMove(gesture.dy),
        onPanResponderRelease: (_event, gesture) =>
          ref.current.onEnd(gesture.dy, false),
        onPanResponderTerminate: (_event, gesture) =>
          ref.current.onEnd(gesture.dy, true),
      }),
    [],
  );

  return responder.panHandlers;
}

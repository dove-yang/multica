import { useMemo, useRef } from "react";
import { PanResponder, type GestureResponderHandlers } from "react-native";

interface HoldToTalkOptions {
  enabled: boolean;
  /** Wait this long before treating the touch as a hold. Short taps call onTap. */
  delayMs?: number;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: (dy: number, cancelled: boolean) => void;
  onTap?: () => void;
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
  delayMs = 0,
  onStart,
  onMove,
  onEnd,
  onTap,
}: HoldToTalkOptions): GestureResponderHandlers {
  const ref = useRef({ enabled, delayMs, onStart, onMove, onEnd, onTap });
  ref.current = { enabled, delayMs, onStart, onMove, onEnd, onTap };
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const startYRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => ref.current.enabled,
        onMoveShouldSetPanResponder: () => ref.current.enabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          startedRef.current = ref.current.delayMs === 0;
          startYRef.current = event.nativeEvent.pageY;
          if (ref.current.delayMs > 0) {
            timerRef.current = setTimeout(() => {
              timerRef.current = null;
              startedRef.current = true;
              ref.current.onStart();
            }, ref.current.delayMs);
          } else {
            ref.current.onStart();
          }
        },
        onPanResponderMove: (_event, gesture) => {
          if (!startedRef.current) {
            // A drag before the hold delay wins: cancel the pending hold so
            // the surface stays scrollable / tappable.
            if (Math.abs(gesture.dy) > 8) clearTimer();
            return;
          }
          ref.current.onMove(gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          clearTimer();
          if (!startedRef.current) {
            ref.current.onTap?.();
            return;
          }
          startedRef.current = false;
          ref.current.onEnd(gesture.dy, false);
        },
        onPanResponderTerminate: (_event, gesture) => {
          clearTimer();
          if (!startedRef.current) return;
          startedRef.current = false;
          ref.current.onEnd(gesture.dy, true);
        },
      }),
    [],
  );

  return responder.panHandlers;
}

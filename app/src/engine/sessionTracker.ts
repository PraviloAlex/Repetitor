// Tracks two distinct time metrics during a lesson:
//   - tiempo en pantalla (total wall-clock from start)
//   - tiempo enfocado (active = total - blur - idle)
// Honest reporting matters: parent should know the difference.

import { useEffect, useRef, useState } from "react";

const IDLE_THRESHOLD_MS = 60_000; // 60s with no interaction => idle

export type SessionMetrics = {
  totalSeconds: number;
  activeSeconds: number;
  blurSeconds: number;
  idleSeconds: number;
  focusLossCount: number;
  pauseCount: number;
};

export function useSessionTracker(): SessionMetrics {
  const [metrics, setMetrics] = useState<SessionMetrics>({
    totalSeconds: 0,
    activeSeconds: 0,
    blurSeconds: 0,
    idleSeconds: 0,
    focusLossCount: 0,
    pauseCount: 0
  });

  const lastTick = useRef<number>(Date.now());
  const lastInteraction = useRef<number>(Date.now());
  const isBlurred = useRef<boolean>(false);
  const focusLossCount = useRef<number>(0);
  const pauseCount = useRef<number>(0);
  const acc = useRef({
    total: 0,
    active: 0,
    blur: 0,
    idle: 0
  });
  const wasIdle = useRef<boolean>(false);

  useEffect(() => {
    const onInteract = () => {
      if (wasIdle.current) {
        wasIdle.current = false;
      }
      lastInteraction.current = Date.now();
    };

    const onVisibility = () => {
      if (document.hidden) {
        isBlurred.current = true;
        focusLossCount.current += 1;
      } else {
        isBlurred.current = false;
      }
    };

    const onBlur = () => {
      if (!isBlurred.current) {
        isBlurred.current = true;
        focusLossCount.current += 1;
      }
    };
    const onFocus = () => {
      isBlurred.current = false;
    };

    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    window.addEventListener("touchstart", onInteract, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      acc.current.total += dt;

      if (isBlurred.current) {
        acc.current.blur += dt;
      } else if (now - lastInteraction.current > IDLE_THRESHOLD_MS) {
        if (!wasIdle.current) {
          wasIdle.current = true;
          pauseCount.current += 1;
        }
        acc.current.idle += dt;
      } else {
        acc.current.active += dt;
      }

      setMetrics({
        totalSeconds: Math.round(acc.current.total / 1000),
        activeSeconds: Math.round(acc.current.active / 1000),
        blurSeconds: Math.round(acc.current.blur / 1000),
        idleSeconds: Math.round(acc.current.idle / 1000),
        focusLossCount: focusLossCount.current,
        pauseCount: pauseCount.current
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return metrics;
}

// Formatter is locale-aware via injected fragments to avoid hard-coding ES.
export function formatMinutes(
  seconds: number,
  parts: { secondsTpl: string; minutesTpl: string; minutesSecondsTpl: string }
): string {
  const fill = (tpl: string, vars: Record<string, number>) => {
    let s = tpl;
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
    return s;
  };

  if (seconds < 60) return fill(parts.secondsTpl, { s: seconds });
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return fill(parts.minutesTpl, { m });
  return fill(parts.minutesSecondsTpl, { m, s });
}

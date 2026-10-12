/**
 * RKStride - Device platform capabilities.
 *
 * Small, dependency-free wrappers around browser APIs that degrade to no-ops.
 * Nothing here may ever throw: a missing vibration motor or a blocked Web
 * Audio context must not interrupt a set being logged mid-workout.
 *
 * Haptic vocabulary is deliberately tiny and semantic:
 *   tap  -> a control accepted input (log set, toggle, +30s)
 *   done -> a timer or block completed (two-pulse, distinct from tap)
 *   warn -> the engine refused or flagged something (long pulse)
 * Keeping the vocabulary at three patterns is what makes it learnable by feel.
 */

const VIBRATION_PATTERNS = {
  tap: [15],
  done: [25, 60, 25],
  warn: [40, 80, 40],
} as const;

function vibrate(pattern: readonly number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern as number[]);
  } catch {
    // Blocked by user-gesture policy, or unsupported. Silent by design.
  }
}

export function hapticTap(): void {
  vibrate(VIBRATION_PATTERNS.tap);
}

export function hapticDone(): void {
  vibrate(VIBRATION_PATTERNS.done);
}

export function hapticWarn(): void {
  vibrate(VIBRATION_PATTERNS.warn);
}

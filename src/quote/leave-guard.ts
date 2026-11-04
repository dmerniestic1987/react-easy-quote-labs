/**
 * Lets the screen that is open say "do not leave yet" to the navigation menu. The quote flow uses it while photos
 * are waiting for approval, because those are the only thing its draft does not keep.
 */
let guard: (() => string | null) | null = null;

export function setLeaveGuard(next: (() => string | null) | null): void {
  guard = next;
}

/** Message to show before leaving the current screen, or null when it is safe to leave. */
export function getLeaveWarning(): string | null {
  return guard ? guard() : null;
}

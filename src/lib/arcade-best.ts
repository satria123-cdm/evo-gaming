/**
 * High score storage for the homepage mini game, wrapped in a tiny external
 * store so React can read localStorage through `useSyncExternalStore` without
 * setting state inside an effect.
 */

const BEST_KEY = "evo-arcade-best";

let cached: number | null = null;
const listeners = new Set<() => void>();

function readBest(): number {
  if (cached !== null) return cached;
  try {
    cached = Math.max(0, Number(window.localStorage.getItem(BEST_KEY)) || 0);
  } catch {
    cached = 0;
  }
  return cached;
}

/** Current high score. Safe to call during SSR (returns 0). */
export function getBestScore(): number {
  if (typeof window === "undefined") return 0;
  return readBest();
}

/** Store a new high score and notify subscribers. */
export function saveBestScore(score: number): void {
  if (typeof window === "undefined") return;
  const next = Math.max(readBest(), score);
  cached = next;
  try {
    window.localStorage.setItem(BEST_KEY, String(next));
  } catch {
    // Private mode or quota issues: the score still lives for this session.
  }
  for (const listener of listeners) listener();
}

export function subscribeBestScore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

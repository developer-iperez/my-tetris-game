const STORAGE_KEY = 'tetris-high-score';

// Wraps localStorage so a missing/blocked storage (e.g. private browsing) degrades
// to "no persisted high score" instead of throwing.
export class HighScoreStore {
  get(): number {
    try {
      const value = Number(localStorage.getItem(STORAGE_KEY));
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  set(value: number): void {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // storage unavailable; high score just won't persist across reloads
    }
  }
}

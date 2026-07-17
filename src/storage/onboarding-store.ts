const STORAGE_KEY = 'tetris-onboarding-seen';

// Same localStorage-with-fallback pattern as HighScoreStore: if storage is
// unavailable, the onboarding screen just shows every time instead of throwing.
export class OnboardingStore {
  hasSeenOnboarding(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  markSeen(): void {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable; onboarding will just show again next time
    }
  }
}

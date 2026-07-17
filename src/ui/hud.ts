import { Game } from '../engine/game.js';

export interface HudElements {
  scoreEl: HTMLElement;
  linesEl: HTMLElement;
  levelEl: HTMLElement;
  highScoreEl: HTMLElement;
  newHighScoreEl: HTMLElement;
  timeRowEl: HTMLElement;
  timeEl: HTMLElement;
  overlayPauseEl: HTMLElement;
  overlayEndEl: HTMLElement;
  gameOverEl: HTMLElement;
  victoryEl: HTMLElement;
  pauseButton: HTMLButtonElement;
}

function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

export class Hud {
  private readonly elements: HudElements;

  constructor(elements: HudElements) {
    this.elements = elements;
  }

  update(game: Game, isPaused: boolean, highScore: number, isNewHighScore: boolean, elapsedMs: number): void {
    const {
      scoreEl,
      linesEl,
      levelEl,
      highScoreEl,
      newHighScoreEl,
      timeRowEl,
      timeEl,
      overlayPauseEl,
      overlayEndEl,
      gameOverEl,
      victoryEl,
      pauseButton,
    } = this.elements;

    const isEnded = game.isGameOver || game.isVictory;

    scoreEl.textContent = String(game.score);
    linesEl.textContent = game.targetLines !== null ? `${game.lines}/${game.targetLines}` : String(game.lines);
    levelEl.textContent = String(game.level);
    highScoreEl.textContent = String(highScore);
    newHighScoreEl.hidden = !(isEnded && isNewHighScore);

    timeRowEl.hidden = game.mode !== 'sprint';
    timeEl.textContent = formatTime(elapsedMs);

    overlayPauseEl.hidden = !(isPaused && !isEnded);
    overlayEndEl.hidden = !isEnded;
    gameOverEl.hidden = !game.isGameOver;
    victoryEl.hidden = !game.isVictory;
    pauseButton.textContent = isPaused ? 'Reanudar' : 'Pausa';
    pauseButton.disabled = isEnded;
  }
}

import { Game } from '../engine/game.js';

export interface HudElements {
  scoreEl: HTMLElement;
  linesEl: HTMLElement;
  levelEl: HTMLElement;
  highScoreEl: HTMLElement;
  newHighScoreEl: HTMLElement;
  gameOverEl: HTMLElement;
  pausedEl: HTMLElement;
  pauseButton: HTMLButtonElement;
}

export class Hud {
  private readonly elements: HudElements;

  constructor(elements: HudElements) {
    this.elements = elements;
  }

  update(game: Game, isPaused: boolean, highScore: number, isNewHighScore: boolean): void {
    const { scoreEl, linesEl, levelEl, highScoreEl, newHighScoreEl, gameOverEl, pausedEl, pauseButton } =
      this.elements;
    scoreEl.textContent = String(game.score);
    linesEl.textContent = String(game.lines);
    levelEl.textContent = String(game.level);
    highScoreEl.textContent = String(highScore);
    newHighScoreEl.hidden = !(game.isGameOver && isNewHighScore);
    gameOverEl.hidden = !game.isGameOver;
    pausedEl.hidden = !isPaused || game.isGameOver;
    pauseButton.textContent = isPaused ? 'Reanudar' : 'Pausa';
    pauseButton.disabled = game.isGameOver;
  }
}

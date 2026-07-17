import { Game } from '../engine/game.js';

export interface HudElements {
  scoreEl: HTMLElement;
  linesEl: HTMLElement;
  levelEl: HTMLElement;
  gameOverEl: HTMLElement;
  pausedEl: HTMLElement;
  pauseButton: HTMLButtonElement;
}

export class Hud {
  private readonly elements: HudElements;

  constructor(elements: HudElements) {
    this.elements = elements;
  }

  update(game: Game, isPaused: boolean): void {
    const { scoreEl, linesEl, levelEl, gameOverEl, pausedEl, pauseButton } = this.elements;
    scoreEl.textContent = String(game.score);
    linesEl.textContent = String(game.lines);
    levelEl.textContent = String(game.level);
    gameOverEl.hidden = !game.isGameOver;
    pausedEl.hidden = !isPaused || game.isGameOver;
    pauseButton.textContent = isPaused ? 'Reanudar' : 'Pausa';
    pauseButton.disabled = game.isGameOver;
  }
}

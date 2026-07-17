import { Game } from '../engine/game.js';

export interface HudElements {
  scoreEl: HTMLElement;
  linesEl: HTMLElement;
  levelEl: HTMLElement;
  gameOverEl: HTMLElement;
}

export class Hud {
  private readonly elements: HudElements;

  constructor(elements: HudElements) {
    this.elements = elements;
  }

  update(game: Game): void {
    const { scoreEl, linesEl, levelEl, gameOverEl } = this.elements;
    scoreEl.textContent = String(game.score);
    linesEl.textContent = String(game.lines);
    levelEl.textContent = String(game.level);
    gameOverEl.hidden = !game.isGameOver;
  }
}

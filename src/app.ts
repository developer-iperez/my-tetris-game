import { Game } from './engine/game.js';
import { CanvasRenderer } from './renderer/canvas-renderer.js';
import { KeyboardControls } from './ui/keyboard-controls.js';
import { Hud } from './ui/hud.js';

class TetrisApp {
  private readonly game: Game;
  private readonly renderer: CanvasRenderer;
  private readonly hud: Hud;
  private readonly controls: KeyboardControls;
  private dropTimerId: ReturnType<typeof setTimeout> | undefined;

  constructor(canvas: HTMLCanvasElement, hudElements: ConstructorParameters<typeof Hud>[0]) {
    this.game = new Game();
    this.renderer = new CanvasRenderer(canvas, this.game);
    this.hud = new Hud(hudElements);
    this.controls = new KeyboardControls({
      moveLeft: () => this.act(() => this.game.moveLeft()),
      moveRight: () => this.act(() => this.game.moveRight()),
      softDrop: () => this.act(() => this.game.softDrop()),
      hardDrop: () => this.act(() => this.game.hardDrop()),
      rotate: () => this.act(() => this.game.rotate()),
    });
  }

  start(): void {
    this.refresh();
    this.scheduleDrop();
  }

  private act(action: () => void): void {
    action();
    this.refresh();
  }

  private refresh(): void {
    this.renderer.render(this.game);
    this.hud.update(this.game);
  }

  private scheduleDrop(): void {
    clearTimeout(this.dropTimerId);
    if (this.game.isGameOver) return;
    this.dropTimerId = setTimeout(() => {
      this.game.tick();
      this.refresh();
      this.scheduleDrop();
    }, this.game.getDropIntervalMs());
  }
}

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element: #${id}`);
  return el as T;
}

const app = new TetrisApp(getRequiredElement('board'), {
  scoreEl: getRequiredElement('score'),
  linesEl: getRequiredElement('lines'),
  levelEl: getRequiredElement('level'),
  gameOverEl: getRequiredElement('game-over'),
});

app.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // offline support is optional; ignore registration failures
    });
  });
}

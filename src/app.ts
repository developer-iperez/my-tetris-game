import { Game } from './engine/game.js';
import { CanvasRenderer } from './renderer/canvas-renderer.js';
import { NextPieceRenderer } from './renderer/next-piece-renderer.js';
import { KeyboardControls } from './ui/keyboard-controls.js';
import { Hud } from './ui/hud.js';
import { HighScoreStore } from './storage/high-score-store.js';

class TetrisApp {
  private readonly game: Game;
  private readonly renderer: CanvasRenderer;
  private readonly nextPieceRenderer: NextPieceRenderer;
  private readonly hud: Hud;
  private readonly controls: KeyboardControls;
  private readonly highScoreStore: HighScoreStore;
  private dropTimerId: ReturnType<typeof setTimeout> | undefined;
  private isPaused = false;
  private highScore: number;
  private isNewHighScore = false;

  constructor(
    canvas: HTMLCanvasElement,
    nextPieceCanvas: HTMLCanvasElement,
    hudElements: ConstructorParameters<typeof Hud>[0],
  ) {
    this.game = new Game();
    this.renderer = new CanvasRenderer(canvas, this.game);
    this.nextPieceRenderer = new NextPieceRenderer(nextPieceCanvas);
    this.hud = new Hud(hudElements);
    this.highScoreStore = new HighScoreStore();
    this.highScore = this.highScoreStore.get();
    this.controls = new KeyboardControls({
      moveLeft: () => this.act(() => this.game.moveLeft()),
      moveRight: () => this.act(() => this.game.moveRight()),
      softDrop: () => this.act(() => this.game.softDrop()),
      hardDrop: () => this.act(() => this.game.hardDrop()),
      rotate: () => this.act(() => this.game.rotate()),
      togglePause: () => this.togglePause(),
      restart: () => this.restart(),
    });
  }

  start(): void {
    this.refresh();
    this.scheduleDrop();
  }

  togglePause(): void {
    if (this.game.isGameOver) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      clearTimeout(this.dropTimerId);
    } else {
      this.scheduleDrop();
    }
    this.refresh();
  }

  restart(): void {
    this.isPaused = false;
    this.isNewHighScore = false;
    clearTimeout(this.dropTimerId);
    this.game.reset();
    this.refresh();
    this.scheduleDrop();
  }

  private act(action: () => void): void {
    if (this.isPaused || this.game.isGameOver) return;
    action();
    this.refresh();
  }

  private refresh(): void {
    if (this.game.isGameOver && this.game.score > this.highScore) {
      this.highScore = this.game.score;
      this.highScoreStore.set(this.highScore);
      this.isNewHighScore = true;
    }
    this.renderer.render(this.game);
    this.nextPieceRenderer.render(this.game.next);
    this.hud.update(this.game, this.isPaused, this.highScore, this.isNewHighScore);
  }

  private scheduleDrop(): void {
    clearTimeout(this.dropTimerId);
    if (this.game.isGameOver || this.isPaused) return;
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

const app = new TetrisApp(getRequiredElement('board'), getRequiredElement('next-piece'), {
  scoreEl: getRequiredElement('score'),
  linesEl: getRequiredElement('lines'),
  levelEl: getRequiredElement('level'),
  highScoreEl: getRequiredElement('high-score'),
  newHighScoreEl: getRequiredElement('new-high-score'),
  gameOverEl: getRequiredElement('game-over'),
  pausedEl: getRequiredElement('paused'),
  pauseButton: getRequiredElement('pause-btn'),
});

getRequiredElement<HTMLButtonElement>('pause-btn').addEventListener('click', () => app.togglePause());
getRequiredElement<HTMLButtonElement>('restart-btn').addEventListener('click', () => app.restart());

app.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // offline support is optional; ignore registration failures
    });
  });
}

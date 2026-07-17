import { GameMode } from './engine/constants.js';
import { Game } from './engine/game.js';
import { CanvasRenderer } from './renderer/canvas-renderer.js';
import { NextPieceRenderer } from './renderer/next-piece-renderer.js';
import { KeyboardControls, ControlActions } from './ui/keyboard-controls.js';
import { TouchControls } from './ui/touch-controls.js';
import { Hud } from './ui/hud.js';
import { Screens } from './ui/screens.js';
import { HighScoreStore } from './storage/high-score-store.js';
import { OnboardingStore } from './storage/onboarding-store.js';

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_START_LEVELS: Readonly<Record<Difficulty, number>> = {
  easy: 1,
  normal: 4,
  hard: 8,
};

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element: #${id}`);
  return el as T;
}

class TetrisApp {
  private game: Game;
  private readonly renderer: CanvasRenderer;
  private readonly nextPieceRenderer: NextPieceRenderer;
  private readonly hud: Hud;
  private readonly screens: Screens;
  private readonly highScoreStore = new HighScoreStore();
  private readonly onboardingStore = new OnboardingStore();

  private readonly modeButtons: Record<GameMode, HTMLButtonElement>;
  private readonly difficultyButtons: Record<Difficulty, HTMLButtonElement>;
  private readonly retryBtn: HTMLButtonElement;

  private dropTimerId: ReturnType<typeof setTimeout> | undefined;
  private isPaused = false;
  private highScore: number;
  private isNewHighScore = false;
  private selectedMode: GameMode = 'marathon';
  private selectedDifficulty: Difficulty = 'normal';
  private gameStartTimestamp = 0;
  private endedAtMs: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    nextPieceCanvas: HTMLCanvasElement,
    hudElements: ConstructorParameters<typeof Hud>[0],
    screenElements: ConstructorParameters<typeof Screens>[0],
    menuElements: {
      highScoreEl: HTMLElement;
      modeButtons: Record<GameMode, HTMLButtonElement>;
      difficultyButtons: Record<Difficulty, HTMLButtonElement>;
      playBtn: HTMLButtonElement;
      helpBtn: HTMLButtonElement;
    },
    helpDoneBtn: HTMLButtonElement,
    actionBarButtons: { pauseBtn: HTMLButtonElement; restartBtn: HTMLButtonElement; menuBtn: HTMLButtonElement },
    endOverlayButtons: { retryBtn: HTMLButtonElement; menuBtn: HTMLButtonElement },
    touchElements: ConstructorParameters<typeof TouchControls>[0],
  ) {
    this.highScore = this.highScoreStore.get();
    this.game = new Game(undefined, undefined, {
      mode: this.selectedMode,
      startLevel: DIFFICULTY_START_LEVELS[this.selectedDifficulty],
    });
    this.renderer = new CanvasRenderer(canvas, this.game);
    this.nextPieceRenderer = new NextPieceRenderer(nextPieceCanvas);
    this.hud = new Hud(hudElements);
    this.screens = new Screens(screenElements);
    this.modeButtons = menuElements.modeButtons;
    this.difficultyButtons = menuElements.difficultyButtons;
    this.retryBtn = endOverlayButtons.retryBtn;

    const actions: ControlActions = {
      moveLeft: () => this.act(() => this.game.moveLeft()),
      moveRight: () => this.act(() => this.game.moveRight()),
      softDrop: () => this.act(() => this.game.softDrop()),
      hardDrop: () => this.act(() => this.game.hardDrop()),
      rotate: () => this.act(() => this.game.rotate()),
      togglePause: () => this.togglePause(),
      restart: () => this.restartFromKeyboard(),
    };
    new KeyboardControls(actions);
    new TouchControls(touchElements, actions);

    menuElements.highScoreEl.textContent = String(this.highScore);
    (Object.entries(this.modeButtons) as [GameMode, HTMLButtonElement][]).forEach(([mode, btn]) => {
      btn.addEventListener('click', () => this.selectMode(mode));
    });
    (Object.entries(this.difficultyButtons) as [Difficulty, HTMLButtonElement][]).forEach(([difficulty, btn]) => {
      btn.addEventListener('click', () => this.selectDifficulty(difficulty));
    });
    menuElements.playBtn.addEventListener('click', () => this.beginGame());
    menuElements.helpBtn.addEventListener('click', () => this.screens.show('help'));
    helpDoneBtn.addEventListener('click', () => {
      this.onboardingStore.markSeen();
      this.screens.show('menu');
    });
    actionBarButtons.pauseBtn.addEventListener('click', () => this.togglePause());
    actionBarButtons.restartBtn.addEventListener('click', () => this.beginGame());
    actionBarButtons.menuBtn.addEventListener('click', () => this.goToMenu());
    endOverlayButtons.retryBtn.addEventListener('click', () => this.beginGame());
    endOverlayButtons.menuBtn.addEventListener('click', () => this.goToMenu());
  }

  start(): void {
    this.screens.show(this.onboardingStore.hasSeenOnboarding() ? 'menu' : 'help');
  }

  private selectMode(mode: GameMode): void {
    this.selectedMode = mode;
    (Object.entries(this.modeButtons) as [GameMode, HTMLButtonElement][]).forEach(([key, btn]) => {
      btn.setAttribute('aria-pressed', String(key === mode));
    });
  }

  private selectDifficulty(difficulty: Difficulty): void {
    this.selectedDifficulty = difficulty;
    (Object.entries(this.difficultyButtons) as [Difficulty, HTMLButtonElement][]).forEach(([key, btn]) => {
      btn.setAttribute('aria-pressed', String(key === difficulty));
    });
  }

  private beginGame(): void {
    this.game = new Game(undefined, undefined, {
      mode: this.selectedMode,
      startLevel: DIFFICULTY_START_LEVELS[this.selectedDifficulty],
    });
    this.isPaused = false;
    this.isNewHighScore = false;
    this.gameStartTimestamp = performance.now();
    this.endedAtMs = null;
    this.screens.show('game');
    this.refresh();
    this.scheduleDrop();
  }

  private restartFromKeyboard(): void {
    if (!this.isGameScreenActive()) return;
    this.beginGame();
  }

  private goToMenu(): void {
    this.isPaused = false;
    clearTimeout(this.dropTimerId);
    this.screens.show('menu');
  }

  private togglePause(): void {
    if (!this.isGameScreenActive() || this.game.isGameOver || this.game.isVictory) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      clearTimeout(this.dropTimerId);
    } else {
      this.scheduleDrop();
    }
    this.refresh();
  }

  private isGameScreenActive(): boolean {
    return this.screens.active === 'game';
  }

  private act(action: () => void): void {
    if (!this.isGameScreenActive() || this.isPaused || this.game.isGameOver || this.game.isVictory) return;
    action();
    this.refresh();
  }

  private refresh(): void {
    const isEnded = this.game.isGameOver || this.game.isVictory;

    if (isEnded && this.endedAtMs === null) {
      this.endedAtMs = performance.now();
      if (this.game.score > this.highScore) {
        this.highScore = this.game.score;
        this.highScoreStore.set(this.highScore);
        this.isNewHighScore = true;
      }
    }

    const elapsedMs = (this.endedAtMs ?? performance.now()) - this.gameStartTimestamp;

    this.renderer.render(this.game);
    this.nextPieceRenderer.render(this.game.next);
    this.hud.update(this.game, this.isPaused, this.highScore, this.isNewHighScore, elapsedMs);

    if (isEnded) this.retryBtn.focus();
  }

  private scheduleDrop(): void {
    clearTimeout(this.dropTimerId);
    if (!this.isGameScreenActive() || this.isPaused || this.game.isGameOver || this.game.isVictory) return;
    this.dropTimerId = setTimeout(() => {
      this.game.tick();
      this.refresh();
      this.scheduleDrop();
    }, this.game.getDropIntervalMs());
  }
}

const app = new TetrisApp(
  getRequiredElement('board'),
  getRequiredElement('next-piece'),
  {
    scoreEl: getRequiredElement('score'),
    linesEl: getRequiredElement('lines'),
    levelEl: getRequiredElement('level'),
    highScoreEl: getRequiredElement('high-score'),
    newHighScoreEl: getRequiredElement('new-high-score'),
    timeRowEl: getRequiredElement('time-row'),
    timeEl: getRequiredElement('time'),
    overlayPauseEl: getRequiredElement('overlay-pause'),
    overlayEndEl: getRequiredElement('overlay-end'),
    gameOverEl: getRequiredElement('game-over'),
    victoryEl: getRequiredElement('victory'),
    pauseButton: getRequiredElement('pause-btn'),
  },
  {
    menu: getRequiredElement('screen-menu'),
    help: getRequiredElement('screen-help'),
    game: getRequiredElement('screen-game'),
  },
  {
    highScoreEl: getRequiredElement('menu-high-score'),
    modeButtons: {
      marathon: getRequiredElement('mode-marathon'),
      sprint: getRequiredElement('mode-sprint'),
    },
    difficultyButtons: {
      easy: getRequiredElement('difficulty-easy'),
      normal: getRequiredElement('difficulty-normal'),
      hard: getRequiredElement('difficulty-hard'),
    },
    playBtn: getRequiredElement('play-btn'),
    helpBtn: getRequiredElement('help-btn'),
  },
  getRequiredElement('help-done-btn'),
  {
    pauseBtn: getRequiredElement('pause-btn'),
    restartBtn: getRequiredElement('restart-btn'),
    menuBtn: getRequiredElement('menu-btn'),
  },
  {
    retryBtn: getRequiredElement('retry-btn'),
    menuBtn: getRequiredElement('menu-btn-end'),
  },
  {
    rotate: getRequiredElement('touch-rotate'),
    left: getRequiredElement('touch-left'),
    right: getRequiredElement('touch-right'),
    softDrop: getRequiredElement('touch-down'),
    hardDrop: getRequiredElement('touch-hard-drop'),
  },
);

app.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // offline support is optional; ignore registration failures
    });
  });
}

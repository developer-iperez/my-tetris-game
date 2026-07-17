export interface ControlActions {
  moveLeft(): void;
  moveRight(): void;
  softDrop(): void;
  hardDrop(): void;
  rotate(): void;
  togglePause(): void;
  restart(): void;
}

export class KeyboardControls {
  private readonly keyMap: Readonly<Record<string, () => void>>;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = this.keyMap[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  constructor(actions: ControlActions) {
    this.keyMap = {
      ArrowLeft: actions.moveLeft,
      ArrowRight: actions.moveRight,
      ArrowDown: actions.softDrop,
      ArrowUp: actions.rotate,
      ' ': actions.hardDrop,
      p: actions.togglePause,
      P: actions.togglePause,
      r: actions.restart,
      R: actions.restart,
    };
    window.addEventListener('keydown', this.handleKeyDown);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}

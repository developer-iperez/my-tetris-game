import { ControlActions } from './keyboard-controls.js';

export interface TouchControlElements {
  left: HTMLElement;
  right: HTMLElement;
  softDrop: HTMLElement;
  hardDrop: HTMLElement;
  rotate: HTMLElement;
}

const REPEAT_INTERVAL_MS = 120;
const REPEAT_INITIAL_DELAY_MS = 250;

// On-screen d-pad for touch devices. Left/right/soft-drop repeat while held,
// mirroring how holding an arrow key behaves on a keyboard; rotate and hard
// drop only ever fire once per press.
export class TouchControls {
  private readonly cleanupFns: Array<() => void> = [];

  constructor(elements: TouchControlElements, actions: ControlActions) {
    this.bindRepeating(elements.left, actions.moveLeft);
    this.bindRepeating(elements.right, actions.moveRight);
    this.bindRepeating(elements.softDrop, actions.softDrop);
    this.bindSingle(elements.hardDrop, actions.hardDrop);
    this.bindSingle(elements.rotate, actions.rotate);
  }

  dispose(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns.length = 0;
  }

  private bindSingle(el: HTMLElement, action: () => void): void {
    const handler = (event: PointerEvent): void => {
      event.preventDefault();
      action();
    };
    el.addEventListener('pointerdown', handler);
    this.cleanupFns.push(() => el.removeEventListener('pointerdown', handler));
  }

  private bindRepeating(el: HTMLElement, action: () => void): void {
    let repeatTimerId: ReturnType<typeof setInterval> | undefined;
    let initialDelayId: ReturnType<typeof setTimeout> | undefined;

    const stop = (): void => {
      clearTimeout(initialDelayId);
      clearInterval(repeatTimerId);
      initialDelayId = undefined;
      repeatTimerId = undefined;
    };

    const onPointerDown = (event: PointerEvent): void => {
      event.preventDefault();
      action();
      initialDelayId = setTimeout(() => {
        repeatTimerId = setInterval(action, REPEAT_INTERVAL_MS);
      }, REPEAT_INITIAL_DELAY_MS);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('pointerleave', stop);

    this.cleanupFns.push(() => {
      stop();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
      el.removeEventListener('pointerleave', stop);
    });
  }
}

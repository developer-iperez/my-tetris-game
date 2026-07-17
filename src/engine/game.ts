import { BOARD_HEIGHT, BOARD_WIDTH, PieceType } from './constants.js';
import { Board } from './board.js';
import { Piece } from './piece.js';

const LINES_PER_LEVEL = 10;
const SCORE_PER_LINES: Readonly<Record<number, number>> = { 1: 100, 2: 300, 3: 500, 4: 800 };
const BASE_DROP_INTERVAL_MS = 1000;
const DROP_INTERVAL_DECREASE_PER_LEVEL_MS = 60;
const MIN_DROP_INTERVAL_MS = 100;
const WALL_KICK_OFFSETS = [0, 1, -1, 2, -2];

export class Game {
  readonly board: Board;
  current: Piece;
  next: PieceType;
  score = 0;
  lines = 0;
  level = 1;
  isGameOver = false;

  constructor(width: number = BOARD_WIDTH, height: number = BOARD_HEIGHT) {
    this.board = new Board(width, height);
    this.current = new Piece(Piece.randomType(), width);
    this.next = Piece.randomType();
  }

  moveLeft(): boolean {
    return this.tryMove(-1, 0);
  }

  moveRight(): boolean {
    return this.tryMove(1, 0);
  }

  softDrop(): boolean {
    const moved = this.tryMove(0, 1);
    if (!moved) this.lockPiece();
    return moved;
  }

  hardDrop(): void {
    if (this.isGameOver) return;
    while (this.tryMove(0, 1)) {
      // keep descending until it settles
    }
    this.lockPiece();
  }

  rotate(): boolean {
    if (this.isGameOver) return false;

    const rotatedCells = this.current.rotatedCells();
    for (const dx of WALL_KICK_OFFSETS) {
      const candidate = this.current.clone();
      candidate.cells = rotatedCells;
      candidate.x += dx;
      if (this.board.isValidPosition(candidate.getAbsoluteCells())) {
        this.current = candidate;
        return true;
      }
    }
    return false;
  }

  // Called on each gravity tick; returns false once the piece has locked.
  tick(): boolean {
    if (this.isGameOver) return false;
    const moved = this.tryMove(0, 1);
    if (!moved) this.lockPiece();
    return moved;
  }

  reset(): void {
    this.board.reset();
    this.current = new Piece(Piece.randomType(), this.board.width);
    this.next = Piece.randomType();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.isGameOver = false;
  }

  getDropIntervalMs(): number {
    return Math.max(
      MIN_DROP_INTERVAL_MS,
      BASE_DROP_INTERVAL_MS - (this.level - 1) * DROP_INTERVAL_DECREASE_PER_LEVEL_MS,
    );
  }

  private tryMove(dx: number, dy: number): boolean {
    if (this.isGameOver) return false;
    const candidate = this.current.clone();
    candidate.x += dx;
    candidate.y += dy;
    if (this.board.isValidPosition(candidate.getAbsoluteCells())) {
      this.current = candidate;
      return true;
    }
    return false;
  }

  private lockPiece(): void {
    this.board.merge(this.current.getAbsoluteCells(), this.current.type);
    const clearedCount = this.board.clearLines();

    if (clearedCount > 0) {
      this.lines += clearedCount;
      this.score += (SCORE_PER_LINES[clearedCount] ?? 0) * this.level;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    }

    this.spawnNextPiece();
  }

  private spawnNextPiece(): void {
    this.current = new Piece(this.next, this.board.width);
    this.next = Piece.randomType();

    if (!this.board.isValidPosition(this.current.getAbsoluteCells())) {
      this.isGameOver = true;
    }
  }
}

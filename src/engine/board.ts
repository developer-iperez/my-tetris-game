import { BOARD_HEIGHT, BOARD_WIDTH, PieceType, Point } from './constants.js';

export type Cell = PieceType | null;

export class Board {
  readonly width: number;
  readonly height: number;
  private grid: Cell[][];

  constructor(width: number = BOARD_WIDTH, height: number = BOARD_HEIGHT) {
    this.width = width;
    this.height = height;
    this.grid = Board.createEmptyGrid(width, height);
  }

  private static createEmptyGrid(width: number, height: number): Cell[][] {
    return Array.from({ length: height }, () => Array<Cell>(width).fill(null));
  }

  get cells(): readonly Cell[][] {
    return this.grid;
  }

  cellAt(x: number, y: number): Cell {
    return this.grid[y]?.[x] ?? null;
  }

  isInside(cells: Point[]): boolean {
    return cells.every(({ x, y }) => x >= 0 && x < this.width && y < this.height);
  }

  hasCollision(cells: Point[]): boolean {
    return cells.some(({ x, y }) => {
      if (y < 0) return false; // above the board is allowed (spawn)
      return this.cellAt(x, y) != null;
    });
  }

  isValidPosition(cells: Point[]): boolean {
    return this.isInside(cells) && !this.hasCollision(cells);
  }

  reset(): void {
    this.grid = Board.createEmptyGrid(this.width, this.height);
  }

  merge(cells: Point[], type: PieceType): void {
    cells.forEach(({ x, y }) => {
      if (y >= 0) {
        const row = this.grid[y];
        if (row) row[x] = type;
      }
    });
  }

  // Clears any full rows, shifting the remaining rows down. Returns the number cleared.
  clearLines(): number {
    const remaining = this.grid.filter((row) => row.some((cell) => cell == null));
    const clearedCount = this.grid.length - remaining.length;
    const newRows = Array.from({ length: clearedCount }, () => Array<Cell>(this.width).fill(null));
    this.grid = [...newRows, ...remaining];
    return clearedCount;
  }
}

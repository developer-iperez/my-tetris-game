import { PIECE_SHAPES, PIECE_TYPES, PieceType, Point } from './constants.js';

export class Piece {
  readonly type: PieceType;
  cells: Point[];
  x: number;
  y: number;

  constructor(type: PieceType, boardWidth: number) {
    this.type = type;
    this.cells = PIECE_SHAPES[type].map((cell) => ({ ...cell }));
    const width = Math.max(...this.cells.map((c) => c.x)) + 1;
    this.x = Math.floor((boardWidth - width) / 2);
    this.y = 0;
  }

  static randomType(): PieceType {
    const index = Math.floor(Math.random() * PIECE_TYPES.length);
    return PIECE_TYPES[index] as PieceType;
  }

  // Returns the cells this piece would occupy after a 90deg clockwise rotation,
  // without mutating the piece itself.
  rotatedCells(): Point[] {
    const maxX = Math.max(...this.cells.map((c) => c.x));
    const maxY = Math.max(...this.cells.map((c) => c.y));
    const size = Math.max(maxX, maxY);

    return this.cells.map(({ x, y }) => ({
      x: size - y,
      y: x,
    }));
  }

  getAbsoluteCells(): Point[] {
    return this.cells.map(({ x, y }) => ({ x: this.x + x, y: this.y + y }));
  }

  clone(): Piece {
    const copy = Object.create(Piece.prototype) as Piece;
    return Object.assign(copy, {
      type: this.type,
      cells: this.cells.map((c) => ({ ...c })),
      x: this.x,
      y: this.y,
    });
  }
}

import { PIECE_COLORS, PIECE_SHAPES, PieceType } from '../engine/constants.js';

const GRID_SIZE = 4; // cells per side; large enough to fit any tetromino's bounding box
const GRID_COLOR = '#222';

export class NextPieceRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly cellSize: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context is not available');
    this.ctx = ctx;
    this.cellSize = Math.floor(canvas.width / GRID_SIZE);
  }

  render(type: PieceType): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const cells = PIECE_SHAPES[type];
    const width = Math.max(...cells.map((c) => c.x)) + 1;
    const height = Math.max(...cells.map((c) => c.y)) + 1;
    const offsetX = Math.floor((GRID_SIZE - width) / 2);
    const offsetY = Math.floor((GRID_SIZE - height) / 2);

    cells.forEach(({ x, y }) => {
      this.drawCell(offsetX + x, offsetY + y, PIECE_COLORS[type]);
    });
  }

  private drawCell(x: number, y: number, color: string): void {
    const { ctx, cellSize } = this;
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = GRID_COLOR;
    ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }
}

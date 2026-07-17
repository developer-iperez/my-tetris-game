import { PIECE_COLORS } from '../engine/constants.js';
import { Game } from '../engine/game.js';

const EMPTY_COLOR = '#111';
const GRID_COLOR = '#222';

export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly cellSize: number;

  constructor(canvas: HTMLCanvasElement, game: Game) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context is not available');
    this.ctx = ctx;
    this.cellSize = Math.floor(canvas.width / game.board.width);
  }

  render(game: Game): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let y = 0; y < game.board.height; y += 1) {
      for (let x = 0; x < game.board.width; x += 1) {
        const cell = game.board.cellAt(x, y);
        this.drawCell(x, y, cell ? PIECE_COLORS[cell] : EMPTY_COLOR);
      }
    }

    game.current.getAbsoluteCells().forEach(({ x, y }) => {
      if (y >= 0) this.drawCell(x, y, PIECE_COLORS[game.current.type]);
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

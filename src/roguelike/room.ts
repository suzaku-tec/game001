export class Room {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  // 座標(x, y)がこの部屋内か判定
  contains(x: number, y: number): boolean {
    return (
      x >= this.x &&
      x < this.x + this.w &&
      y >= this.y &&
      y < this.y + this.h
    );
  }

  // 部屋の中心座標を返す
  getCenter(): { x: number; y: number } {
    return {
      x: Math.floor(this.x + this.w / 2),
      y: Math.floor(this.y + this.h / 2)
    };
  }
}

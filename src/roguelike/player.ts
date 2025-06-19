import { Direction } from "./types";
import { Item } from "./item";

export class Player {
  x: number;
  y: number;
  hp: number;
  items: Item[] = [];
  direction: Direction = "down";

  constructor(x: number, y: number, hp: number = 10) {
    this.x = x;
    this.y = y;
    this.hp = hp;
  }

  move(dx: number, dy: number, dir: Direction) {
    this.x += dx;
    this.y += dy;
    this.direction = dir;
  }

  addItem(item: Item) {
    this.items.push(item);
  }

  // 必要に応じて他のメソッドも追加
}

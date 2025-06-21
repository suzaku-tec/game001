import { Direction } from "./types";
import { MapItem } from "./item";
import { Command } from "../game/command";
import { log } from "../utils/logger";
import { Actor, Status } from "./actor";

export class Player extends Actor {
  items: MapItem[] = [];
  direction: Direction = "down";
  level: number = 1;

  constructor(emitter: Phaser.Events.EventEmitter, x: number, y: number, status: Status) {
    super(emitter, x, y, status);
  }

  move(dx: number, dy: number, dir: Direction) {
    this.x += dx;
    this.y += dy;
    this.direction = dir;
  }

  addItem(item: MapItem) {
    this.items.push(item);
  }

  itemCmdList(): Command[] {
    return this.items.map((item, index) => (
      {
        id: `item-${index}`,
        label: item.type,
        action: () => {
          log(`使用アイテム: ${item.type}`);
          // item.typeをファイル名としてitemフォルダから探して実行
        }
      }
    ));
  }

  // 必要に応じて他のメソッドも追加
}

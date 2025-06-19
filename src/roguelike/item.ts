export type ItemType = "potion" | "key" | "scroll"; /* | 'key' | 'potion' など今後追加 */;
import Phaser from "phaser";
import { TILE_SIZE } from "../constants";

export class Item {
  x: number;
  y: number;
  type: string;
  obj: Phaser.GameObjects.GameObject;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: string,
    color: number,
    offsetY: number
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    // 表示用オブジェクトを生成
    this.obj = scene.add.rectangle(
      x * TILE_SIZE + 8,
      y * TILE_SIZE + 8 + offsetY,
      8,
      8,
      color
    );
  }

  // アイテムをマップから消す
  destroy() {
    this.obj.destroy();
  }
}

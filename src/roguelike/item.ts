export type ItemType = "potion" | "key" | "scroll"; /* | 'key' | 'potion' など今後追加 */;
import Phaser from "phaser";
import { ITEM_COLOR, TILE_SIZE } from "../constants";
import { Actor } from "./actor";
import { log } from "../utils/logger";

const itemList: Item[] = [
  {
    id: 1,
    type: "potion",
    description: "HPを5回復する",
    name: "薬草",
    effect: (target, item) => {
      log(`hp + 5`);
      if (target.hp + 5 > target.maxHp) {
        target.hp = target.maxHp; // 最大HPを超えないようにする
      } else {
        target.hp += 5;
      }

      target.updateInfo();
    },
  },
  {
    id: 2,
    type: "potion",
    description: "HPを全回復する",
    name: "エリクサー",
    effect: (target, item) => {
      target.hp = target.maxHp;
    }
  }
]

interface Item {
  id: number; // アイテムの一意な識別子（オプション）
  type: ItemType;
  description: string;
  name: string;
  effect: (target: Actor, item: Item) => void;
}

export function getItemInfo(id: number): Item | undefined {
  return itemList.find(item => item.id === id ? item : null);
}

export class MapItem implements Item {
  x: number;
  y: number;
  obj: Phaser.GameObjects.GameObject;
  id: number;
  type: ItemType;
  description: string;
  name: string;
  effect: (target: Actor, item: Item) => void;


  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    offsetY: number,
    item: Item
  ) {
    this.x = x;
    this.y = y;
    this.id = item.id;
    this.type = item.type;
    this.description = item.description;
    this.name = item.name;
    this.effect = item.effect;

    // 表示用オブジェクトを生成
    this.obj = scene.add.rectangle(
      x * TILE_SIZE + 8,
      y * TILE_SIZE + 8 + offsetY,
      8,
      8,
      ITEM_COLOR
    );
  }

  // アイテムをマップから消す
  destroy() {
    this.obj.destroy();
  }
}

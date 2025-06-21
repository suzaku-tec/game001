import { Player } from "./player";

export interface Trap {
  x: number;
  y: number;
  visible: boolean;
}

export class MapTrap implements Trap {
  x: number;
  y: number;
  visible: boolean;
  obj!: Phaser.GameObjects.Rectangle;

  constructor(x: number, y: number, visible: boolean = false) {
    this.x = x;
    this.y = y;
    this.visible = visible;
  }

  activation(player: Player): void {
    player.hp -= 5; // 罠にかかったらHPを1減らす
  }

}

import { ENEMY_COLOR, TILE_SIZE } from "../constants";

export class Enemy {
  x: number;
  y: number;
  hp: number;
  attack: number;
  sprite: Phaser.GameObjects.Rectangle;
  offsetY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, offsetY: number, hp = 5, attack = 2) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.attack = attack;
    this.offsetY = offsetY;
    this.sprite = scene.add.rectangle(
      x * TILE_SIZE + 8,
      y * TILE_SIZE + 8 + offsetY,
      12,
      12,
      ENEMY_COLOR
    );
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    this.sprite.setPosition(this.x * TILE_SIZE + 8, this.y * TILE_SIZE + 8 + this.offsetY);
  }

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.sprite.destroy();
    }
  }

}

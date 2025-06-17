import Phaser from "phaser";
import { generateMap } from "./mapGenerator";

export default class MainScene extends Phaser.Scene {
  private tileSize = 16;
  private map: number[][] = [];
  private player?: Phaser.GameObjects.Rectangle;
  private playerPos = { x: 0, y: 0 };

  preload() { }

  create() {
    this.map = generateMap(50, 40);

    this.drawMap();

    this.player = this.add.rectangle(
      this.playerPos.x * this.tileSize + 8,
      this.playerPos.y * this.tileSize + 8,
      12,
      12,
      0x00ff00
    );


    // カメラ追従の設定
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, 800, 600);

    this.input.keyboard?.on("keydown", this.handleMove, this);
  }

  drawMap() {
    const g = this.add.graphics();
    g.clear();

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[0].length; x++) {
        const color = this.map[y][x] === 1 ? 0x333333 : 0xcccccc;
        g.fillStyle(color);
        g.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

        if (this.map[y][x] === 0 && this.playerPos.x === 0 && this.playerPos.y === 0) {
          this.playerPos = { x, y }; // 最初の通路を開始位置に
        }
      }
    }
  }

  handleMove(event: KeyboardEvent) {
    const dirMap: Record<string, { x: number; y: number }> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };

    const move = dirMap[event.key];
    if (!move) return;

    const newX = this.playerPos.x + move.x;
    const newY = this.playerPos.y + move.y;

    if (this.map[newY]?.[newX] === 0) {
      this.playerPos = { x: newX, y: newY };
      this.player?.setPosition(
        this.playerPos.x * this.tileSize + 8,
        this.playerPos.y * this.tileSize + 8
      );
    }
  }
}

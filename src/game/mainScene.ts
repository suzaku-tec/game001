import Phaser from "phaser";
import { generateMap } from "./mapGenerator";
import { Item } from '../roguelike/item';
import { Player } from '../roguelike/player';
import { Enemy } from '../roguelike/enemy';
import { Direction } from "../roguelike/types";
import { ITEM_COLOR, PLAYER_COLOR, TILE_SIZE } from "../constants";
import { Room } from "../roguelike/room";

export default class MainScene extends Phaser.Scene {
  private map: number[][] = [];
  private playerSprite?: Phaser.GameObjects.Graphics;
  private player!: Player;
  private infoText?: Phaser.GameObjects.Text;
  private items: Item[] = [];
  private rooms: Room[] = [];
  private enemies: Enemy[] = [];
  private messageBox?: Phaser.GameObjects.Rectangle;
  private messageText?: Phaser.GameObjects.Text;
  private stairsPos?: { x: number; y: number };
  private stairsSprite?: Phaser.GameObjects.Rectangle;

  private itemWindowBox?: Phaser.GameObjects.Rectangle;
  private itemWindowText?: Phaser.GameObjects.Text;
  private isItemWindowOpen = false;

  preload() { }

  create() {
    // 2. infoTextの高さを取得
    const offsetY = 24;

    // 3. マップ生成・描画
    const mapData = generateMap(50, 40);
    this.map = mapData.map;
    this.rooms = mapData.rooms;

    this.drawMap(offsetY);

    // プレイヤー初期位置
    const startPos = { ...this.findStartPos() };
    this.player = new Player(startPos.x, startPos.y);

    this.infoText = this.add.text(
      10, // X座標（左端から10pxなど）
      0, // Y座標（画面の最上部）
      this.getPlayerInfoText(),
      {
        fontSize: "16px",
        color: "#fff",
        backgroundColor: "#222",
        padding: { x: 8, y: 4 }
      }
    ).setScrollFactor(0); // カメラ

    // アイテムを配置
    this.placeItemsInRooms(10, offsetY);

    this.playerSprite = this.add.graphics();
    this.drawPlayerSprite(offsetY);

    // 敵を3体配置（部屋の中心などに配置例）
    for (let i = 0; i < 3; i++) {
      const room = this.rooms[i % this.rooms.length];
      const x = Math.floor(room.x + room.w / 2);
      const y = Math.floor(room.y + room.h / 2);
      // プレイヤー初期位置と被らないように
      if (x !== this.player.x || y !== this.player.y) {
        this.enemies.push(new Enemy(this, x, y, offsetY));
      }
    }

    // 階段の座標を決定（例：最後の部屋の中心）
    const lastRoom = this.rooms[this.rooms.length - 1];
    this.stairsPos = lastRoom.getCenter();
    // 階段を描画
    this.drawStairs(offsetY);

    // カメラ追従の設定
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, 800, 640);

    this.input.keyboard?.on("keydown", this.handleMove, this);
    this.input.keyboard?.on("keydown-I", () => {
      if (this.itemWindowBox) {
        this.hideItemWindow();
      } else {
        this.showItemWindow();
      }
    });
    // 隠しコマンド：Shift+Rでゲーム再スタート
    this.input.keyboard?.on("keydown-R", (event: KeyboardEvent) => {
      if (event.shiftKey) {
        this.scene.restart();
      }
    });
  }

  // プレイヤー開始位置を決定
  private findStartPos() {
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[0].length; x++) {
        if (this.map[y][x] === 0) {
          return { x, y };
        }
      }
    }
    return { x: 1, y: 1 };
  }

  // 部屋にアイテムを配置
  placeItemsInRooms(count: number, offsetY: number) {
    // 部屋の中心座標リストを作成
    const centers = this.rooms.map(room => room.getCenter());
    Phaser.Utils.Array.Shuffle(centers);

    for (let i = 0; i < Math.min(count, centers.length); i++) {
      const pos = centers[i];
      const item = new Item(this, pos.x, pos.y, "potion", ITEM_COLOR, offsetY);
      this.items.push(item);
    }
  }

  drawMap(offsetY: number) {
    const g = this.add.graphics();
    g.clear();

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[0].length; x++) {
        const color = this.map[y][x] === 1 ? 0x333333 : 0xcccccc;
        g.fillStyle(color);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE + offsetY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  handleMove(event: KeyboardEvent) {
    if (this.isItemWindowOpen) return; // ←ウインドウ表示中は何もしない

    const dirMap: Record<string, { x: number; y: number, dir: Direction }> = {
      ArrowUp: { x: 0, y: -1, dir: "up" },
      ArrowDown: { x: 0, y: 1, dir: "down" },
      ArrowLeft: { x: -1, y: 0, dir: "left" },
      ArrowRight: { x: 1, y: 0, dir: "right" },
    };

    const offsetY = this.infoText ? this.infoText.height : 0; // infoTextの高さを考慮

    // 攻撃キー（例：スペース）で攻撃
    if (event.key === " ") {
      this.attackEnemy();
      return;
    }

    const move = dirMap[event.key];
    if (!move) return;

    const newX = this.player.x + move.x;
    const newY = this.player.y + move.y;

    // 敵の上に移動できない
    const enemyOnTarget = this.enemies.some(e => e.x === newX && e.y === newY);

    // 壁や敵がある場合は向きだけ変更
    if (this.map[newY]?.[newX] !== 0 || enemyOnTarget) {
      this.player.direction = move.dir;
      this.drawPlayerSprite(offsetY);
      return;
    }

    if (this.map[newY]?.[newX] === 0) {
      this.player.move(move.x, move.y, move.dir);
      // 移動後に階段判定
      if (this.stairsPos && this.player.x === this.stairsPos.x && this.player.y === this.stairsPos.y) {
        this.showMessage("ゲームクリア！");
        // 必要ならゲームクリア処理を追加
        // 例: this.scene.pause(); など
        return;
      }

      this.drawPlayerSprite(offsetY);

      // プレイヤー位置にあるアイテムを探す
      const idx = this.items.findIndex(item => item.x === this.player.x && item.y === this.player.y);
      if (idx !== -1) {
        const item = this.items[idx];
        // プレイヤーの所持品に追加
        this.showMessage("アイテムを拾った！");
        this.player.addItem(item);
        // マップ上から消す
        item.destroy();
        this.items.splice(idx, 1);
      }

      this.updatePlayerInfo();

      // --- ターン制: プレイヤーの後に敵が動く ---
      this.enemyTurn();
    } else {
      // 向きだけ変える
      this.player.direction = move.dir;
      this.drawPlayerSprite(offsetY);
    }
  }

  // プレイヤー情報テキストを作成
  private getPlayerInfoText(): string {
    return `HP: ${this.player.hp} アイテム数: ${this.player.items.length}`;
  }

  // 例：アイテム取得やHP変動時に呼ぶ
  private updatePlayerInfo() {
    this.infoText?.setText(this.getPlayerInfoText());
  }

  private enemyTurn() {
    for (const enemy of this.enemies) {
      // 敵とプレイヤーが同じ部屋か判定
      const enemyRoom = this.rooms.find(room => room.contains(enemy.x, enemy.y));
      const playerRoom = this.rooms.find(room => room.contains(this.player.x, this.player.y));

      if (enemyRoom && playerRoom && enemyRoom === playerRoom) {
        // 同じ部屋：プレイヤーに1マス近づく
        let dx = 0, dy = 0;
        if (enemy.x < this.player.x) dx = 1;
        else if (enemy.x > this.player.x) dx = -1;
        if (enemy.y < this.player.y) dy = 1;
        else if (enemy.y > this.player.y) dy = -1;

        // 斜め移動を避ける（x優先）
        if (dx !== 0 && dy !== 0) {
          if (Math.abs(this.player.x - enemy.x) > Math.abs(this.player.y - enemy.y)) {
            dy = 0;
          } else {
            dx = 0;
          }
        }

        const nx = enemy.x + dx;
        const ny = enemy.y + dy;
        const occupied = this.enemies.some(e => e !== enemy && e.x === nx && e.y === ny)
          || (this.player.x === nx && this.player.y === ny);
        if (this.map[ny]?.[nx] === 0 && !occupied) {
          enemy.move(dx, dy);
        }
        // 移動できない場合は何もしない
      } else {
        // 違う部屋：ランダム移動
        const dirs = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 }
        ];
        Phaser.Utils.Array.Shuffle(dirs);
        for (const dir of dirs) {
          const nx = enemy.x + dir.x;
          const ny = enemy.y + dir.y;
          const occupied = this.enemies.some(e => e !== enemy && e.x === nx && e.y === ny)
            || (this.player.x === nx && this.player.y === ny);
          if (this.map[ny]?.[nx] === 0 && !occupied) {
            enemy.move(dir.x, dir.y);
            break;
          }
        }
      }
    }
  }

  // プレイヤーの向きに応じて三角形を描画
  private drawPlayerSprite(offsetY: number) {
    if (!this.playerSprite) return;
    this.playerSprite.clear();
    this.playerSprite.fillStyle(PLAYER_COLOR, 1);

    const size = 12;
    const cx = this.player.x * TILE_SIZE + 8;
    const cy = this.player.y * TILE_SIZE + 8 + offsetY;

    let points: { x: number; y: number }[];
    switch (this.player.direction) {
      case "up":
        points = [
          { x: cx, y: cy - size / 2 },
          { x: cx - size / 2, y: cy + size / 2 },
          { x: cx + size / 2, y: cy + size / 2 }
        ];
        break;
      case "down":
        points = [
          { x: cx, y: cy + size / 2 },
          { x: cx - size / 2, y: cy - size / 2 },
          { x: cx + size / 2, y: cy - size / 2 }
        ];
        break;
      case "left":
        points = [
          { x: cx - size / 2, y: cy },
          { x: cx + size / 2, y: cy - size / 2 },
          { x: cx + size / 2, y: cy + size / 2 }
        ];
        break;
      case "right":
        points = [
          { x: cx + size / 2, y: cy },
          { x: cx - size / 2, y: cy - size / 2 },
          { x: cx - size / 2, y: cy + size / 2 }
        ];
        break;
      default:
        points = [];
    }
    this.playerSprite.fillPoints(points, true);
  }

  // プレイヤーの攻撃処理
  private attackEnemy() {
    // プレイヤーの向きにいる敵を探す
    const dirMap = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    const dir = dirMap[this.player.direction];
    const targetX = this.player.x + dir.x;
    const targetY = this.player.y + dir.y;

    const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
    if (enemy) {
      enemy.takeDamage(3); // プレイヤーの攻撃力を仮に3とする
      this.showMessage("敵に3のダメージを与えた！");
      if (enemy.hp <= 0) {
        // 敵をリストから削除
        this.showMessage("敵を倒した！");
        this.enemies = this.enemies.filter(e => e !== enemy);
      } else {
        // 反撃（例：敵の攻撃力ぶんプレイヤーのHPを減らす）
        this.player.hp -= enemy.attack;
        this.showMessage("敵から" + enemy.attack + "のダメージを受けた！");
        this.updatePlayerInfo();
      }
    }
  }

  // メッセージウインドウを表示
  showMessage(message: string) {
    // すでに表示中なら一度消す
    this.hideMessage();

    const padding = 20;
    const boxWidth = this.cameras.main.width - 40;
    const boxHeight = 50;
    const boxX = this.cameras.main.centerX;
    const boxY = this.cameras.main.height - 60;

    this.messageBox = this.add.rectangle(
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      0x222222,
      0.8
    ).setOrigin(0.5, 0.5).setScrollFactor(0);

    // テキスト
    this.messageText = this.add.text(
      boxX - boxWidth / 2 + padding, // 左端＋パディング
      boxY - boxHeight / 2 + padding, // 上端＋パディング
      message,
      {
        fontSize: "18px",
        color: "#fff",
        wordWrap: { width: boxWidth - padding * 2 },
        padding: { top: 4 }
      }
    ).setScrollFactor(0);
  }

  // メッセージウインドウを消す
  hideMessage() {
    this.messageBox?.destroy();
    this.messageText?.destroy();
    this.messageBox = undefined;
    this.messageText = undefined;
  }

  private drawStairs(offsetY: number) {
    if (!this.stairsPos) return;
    this.stairsSprite = this.add.rectangle(
      this.stairsPos.x * TILE_SIZE + 8,
      this.stairsPos.y * TILE_SIZE + 8 + offsetY,
      12,
      12,
      0x8888ff // 階段の色（お好みで）
    );
  }
  // アイテムウインドウを表示
  showItemWindow() {
    this.hideItemWindow();
    this.isItemWindowOpen = true;

    const padding = 20;
    const boxWidth = 300;
    const boxHeight = 200;

    const infoHeight = this.infoText ? this.infoText.height : 0;

    // 右上詰め（infoエリアの下、右端からpadding分左）
    const boxX = boxWidth / 2 + padding;
    const boxY = infoHeight + boxHeight / 2 + padding;

    this.itemWindowBox = this.add.rectangle(
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      0x222222,
      0.95
    ).setOrigin(0.5, 0.5).setScrollFactor(0);

    // 所持アイテム一覧を作成
    const itemList = this.player.items.length
      ? this.player.items.map((item, i) => `${i + 1}. ${item.type}`).join("\n")
      : "アイテムなし";

    this.itemWindowText = this.add.text(
      boxX - boxWidth / 2 + padding,
      boxY - boxHeight / 2 + padding,
      `所持アイテム\n\n${itemList}`,
      {
        fontSize: "18px",
        color: "#fff",
        wordWrap: { width: boxWidth - padding * 2 },
        padding: { top: 4 }
      }
    ).setScrollFactor(0);
  }

  // アイテムウインドウを非表示
  hideItemWindow() {
    this.itemWindowBox?.destroy();
    this.itemWindowText?.destroy();
    this.itemWindowBox = undefined;
    this.itemWindowText = undefined;
    this.isItemWindowOpen = false;
  }

}

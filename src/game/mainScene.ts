import Phaser from "phaser";
import { getItemInfo } from '../roguelike/item';
import { Player } from '../roguelike/player';
import { Direction } from "../roguelike/types";
import { EMIT_PLAYER_UPDATE, EMIT_SHOW_MESSAGE, MESSAGE_FONT_SIZE, PLAYER_COLOR, TILE_SIZE } from "../constants";
import { str, setLang } from "../i18n"
import { log, logMethod } from "../utils/logger";
import { Command } from "./command";
import { getCharacter } from "../roguelike/playableCharacter";
import { MapData } from "../roguelike/map";

export default class MainScene extends Phaser.Scene {
  private playerSprite?: Phaser.GameObjects.Graphics;
  private player!: Player;
  private infoText?: Phaser.GameObjects.Text;
  private messageBox?: Phaser.GameObjects.Rectangle;
  private messageText?: Phaser.GameObjects.Text;
  private commandWindowBox?: Phaser.GameObjects.Rectangle;
  private commandWindowText?: Phaser.GameObjects.Text;
  private isCommandWindowOpen = false;
  private commandIndex: number = 0;
  private subCommandWindowBox?: Phaser.GameObjects.Rectangle;
  private subCommandWindowText?: Phaser.GameObjects.Text;
  private subCommandList: Command[] = [];
  private subCommandIndex: number = 0;
  private isSubCommandWindowOpen = false;
  private INFO_TEXT_HEIGHT: number = 24; // infoTextの高さを固定値で設定
  private emitter = new Phaser.Events.EventEmitter();
  // private traps: Trap[] = [];

  private mapData!: MapData;

  private commandList: Command<Player>[] = [
    {
      id: "use_item",
      label: "アイテム",
      action: () => this.showSubCommandWindow(this.createItemCmdList()),
    },
    {
      id: "equip_weapon",
      label: "装備",
      action: () => log("装備コマンドが選択されました"),
    },
    {
      id: "close",
      label: "閉じる",
      action: () => this.hideCommandWindow()
    }
  ];

  preload() {
    setLang("ja"); // 言語設定（必要に応じて）

    this.emitter.on(EMIT_PLAYER_UPDATE, () => {
      this.updatePlayerInfo();
    });

    this.emitter.on(EMIT_SHOW_MESSAGE, (message: string) => {
      this.showMessage(message);
    });

    this.mapData = new MapData(this, 50, 40, this.INFO_TEXT_HEIGHT, this.emitter);
  }

  create() {
    // 2. infoTextの高さを取得
    const offsetY = this.INFO_TEXT_HEIGHT;

    this.mapData.drawMap(offsetY);

    // プレイヤー初期位置
    const startPos = { ...this.findStartPos() };
    // TODO: どうするか考える
    const id = "1"; // プレイヤーキャラクターのID
    let charStatus = getCharacter(id);
    if (!charStatus) {
      log("not found playable character: " + id);
      charStatus = getCharacter("test")!;
    }
    this.player = new Player(this.emitter, startPos.x, startPos.y, charStatus);
    this.mapData.setPlayer(this.player);

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

    this.mapData.places({
      isItemPlaceCnt: 10,
      isTrapPlaceCnt: 5,
      isEnemyPlaceCnt: 3
    });
    this.mapData.drawTraps();

    this.playerSprite = this.add.graphics();
    this.drawPlayerSprite(offsetY);

    this.mapData.drawStairs();

    // カメラ追従の設定
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, 800, 640);

    // this.input.keyboard?.on("keydown", this.handleMove, this);
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      log(event.key);
      if (this.isSubCommandWindowOpen) {
        this.handleSubCommandWindowInput(event);
      } else if (this.isCommandWindowOpen) {
        this.handleCommandWindowInput(event);
      } else {
        this.handleNormalInput(event);
      }
    });
  }

  // プレイヤー開始位置を決定
  private findStartPos() {
    // ランダムな部屋を選ぶ
    const room = Phaser.Utils.Array.GetRandom(this.mapData.rooms);

    // 部屋内のランダムな座標を決定
    const x = Phaser.Math.Between(room.x + 1, room.x + room.w - 2);
    const y = Phaser.Math.Between(room.y + 1, room.y + room.h - 2);

    return { x: x, y: y };
  }

  handleMove(event: KeyboardEvent) {
    if (this.isCommandWindowOpen) return; // ←ウインドウ表示中は何もしない

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
    const enemyOnTarget = this.mapData.existsEnemy(newX, newY);
    // const enemyOnTarget = this.enemies.some(e => e.x === newX && e.y === newY);

    // 壁や敵がある場合は向きだけ変更
    if (this.mapData.map[newY]?.[newX] !== 0 || enemyOnTarget) {
      this.player.direction = move.dir;
      this.drawPlayerSprite(offsetY);
      return;
    }

    if (this.mapData.map[newY]?.[newX] === 0) {
      this.player.move(move.x, move.y, move.dir);

      // プレイヤー移動後に呼ぶ
      // this.checkTrap();
      if (this.mapData.existsTrap(newX, newY)) {
        log("trap activated at " + newX + "," + newY);
        this.mapData.activateTrap(newX, newY,);
        this.mapData.drawTraps(); // トラップを再描画
      }

      // 移動後に階段判定
      if (this.mapData.existsStairs(newX, newY)) {
        this.showMessage(str("game_clear"));
        // 必要ならゲームクリア処理を追加
        // 例: this.scene.pause(); など
        return;
      }

      this.drawPlayerSprite(offsetY);

      // プレイヤー位置にあるアイテムを探す
      const idx = this.mapData.items.findIndex(item => item.x === this.player.x && item.y === this.player.y);
      if (idx !== -1) {
        const item = this.mapData.items[idx];
        // プレイヤーの所持品に追加
        this.showMessage(str("item_get", { name: item.name }));
        this.player.addItem(item);
        // マップ上から消す
        item.destroy();
        this.mapData.items.splice(idx, 1);
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
    return `Lv: ${this.player.level} / HP: ${this.player.hp}`;
  }

  // 例：アイテム取得やHP変動時に呼ぶ
  private updatePlayerInfo() {
    this.infoText?.setText(this.getPlayerInfoText());
  }

  private enemyTurn() {
    for (const enemy of this.mapData.enemies) {
      // 敵とプレイヤーが同じ部屋か判定
      const enemyRoom = this.mapData.rooms.find(room => room.contains(enemy.x, enemy.y));
      const playerRoom = this.mapData.rooms.find(room => room.contains(this.player.x, this.player.y));

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
        const occupied = this.mapData.enemies.some(e => e !== enemy && e.x === nx && e.y === ny)
          || (this.player.x === nx && this.player.y === ny);
        if (this.mapData.map[ny]?.[nx] === 0 && !occupied) {
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
          const occupied = this.mapData.enemies.some(e => e !== enemy && e.x === nx && e.y === ny)
            || (this.player.x === nx && this.player.y === ny);
          if (this.mapData.map[ny]?.[nx] === 0 && !occupied) {
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

    const enemy = this.mapData.enemies.find(e => e.x === targetX && e.y === targetY);
    if (enemy) {
      enemy.takeDamage(3); // プレイヤーの攻撃力を仮に3とする
      this.showMessage(str("damage", { damage: 3 }));
      if (enemy.hp <= 0) {
        // 敵をリストから削除
        this.showMessage(str("enemy_defeated", { enemy: "敵" }));
        this.mapData.enemies = this.mapData.enemies.filter(e => e !== enemy);
      } else {
        // 反撃（例：敵の攻撃力ぶんプレイヤーのHPを減らす）
        this.player.hp -= enemy.attack;
        this.showMessage(str("damage_received", { damage: enemy.attack }));
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
    const boxY = this.cameras.main.height - 50;

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
        fontSize: MESSAGE_FONT_SIZE,
        color: "#fff",
        wordWrap: { width: boxWidth - padding * 2 },
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

  // コマンドウインドウを表示
  showCommandWindow() {
    this.hideCommandWindow();
    this.isCommandWindowOpen = true;

    const padding = 20;
    const boxWidth = 300;
    const boxHeight = 200;
    const infoHeight = this.infoText ? this.infoText.height : 0;
    const boxX = boxWidth / 2 + padding;
    const boxY = infoHeight + boxHeight / 2 + padding;

    this.commandWindowBox = this.add.rectangle(
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      0x222222,
      0.95
    ).setOrigin(0.5, 0.5).setScrollFactor(0);

    const commandText = this.commandList.map((cmd, i) =>
      `${i === this.commandIndex ? "▶" : "  "} ${cmd.label}`
    ).join("\n");

    this.commandWindowText = this.add.text(
      boxX - boxWidth / 2 + padding,
      boxY - boxHeight / 2 + padding,
      commandText,
      {
        fontSize: MESSAGE_FONT_SIZE,
        color: "#fff",
        wordWrap: { width: boxWidth - padding * 2 }
      }
    ).setScrollFactor(0);
  }

  // コマンドウインドウを非表示
  hideCommandWindow() {
    this.commandWindowBox?.destroy();
    this.commandWindowText?.destroy();
    this.commandWindowBox = undefined;
    this.commandWindowText = undefined;
    this.isCommandWindowOpen = false;
    this.commandIndex = 0;
  }

  // コマンドウインドウの内容を更新
  updateCommandWindow() {
    if (!this.commandWindowText) return;
    const commandText = this.commandList.map((cmd, i) =>
      `${i === this.commandIndex ? "▶" : "  "} ${cmd.label}`
    ).join("\n");
    this.commandWindowText.setText(commandText);
  }

  // サブコマンドウインドウを表示
  showSubCommandWindow(cmdList: Command[]) {
    this.hideSubCommandWindow();
    this.subCommandList = cmdList;
    this.isSubCommandWindowOpen = true;

    const padding = 20;
    const boxWidth = 200;
    const boxHeight = 150;
    const infoHeight = this.infoText ? this.infoText.height : 0;

    // メインコマンドウインドウの右隣に表示
    const mainBoxWidth = 300;
    const mainBoxX = mainBoxWidth / 2 + padding;
    const boxX = mainBoxX + mainBoxWidth / 2 + boxWidth / 2 + padding;
    const boxY = infoHeight + boxHeight / 2 + padding;

    this.subCommandIndex = 0;

    this.subCommandWindowBox = this.add.rectangle(
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      0x444444,
      0.95
    ).setOrigin(0.5, 0.5).setScrollFactor(0);

    const subCommandText = cmdList.map((cmd, i) =>
      `${i === this.subCommandIndex ? "▶" : "  "} ${cmd.label}`
    ).join("\n");

    this.subCommandWindowText = this.add.text(
      boxX - boxWidth / 2 + padding,
      boxY - boxHeight / 2 + padding,
      subCommandText,
      {
        fontSize: MESSAGE_FONT_SIZE,
        color: "#fff",
        wordWrap: { width: boxWidth - padding * 2 }
      }
    ).setScrollFactor(0);
  }

  // サブコマンドウインドウを非表示
  hideSubCommandWindow() {
    this.subCommandWindowBox?.destroy();
    this.subCommandWindowText?.destroy();
    this.subCommandWindowBox = undefined;
    this.subCommandWindowText = undefined;
    this.isSubCommandWindowOpen = false;
    this.subCommandIndex = 0;
  }

  // サブコマンドウインドウの内容を更新
  updateSubCommandWindow(cmdList: Command[]) {
    if (!this.subCommandWindowText) return;
    const subCommandText = cmdList.map((cmd, i) =>
      `${i === this.subCommandIndex ? "▶" : "  "} ${cmd.label}`
    ).join("\n");
    this.subCommandWindowText.setText(subCommandText);
  }

  @logMethod
  private handleCommandWindowInput(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowUp":
        this.commandIndex = (this.commandIndex + this.commandList.length - 1) % this.commandList.length;
        this.updateCommandWindow();
        break;
      case "ArrowDown":
        this.commandIndex = (this.commandIndex + 1) % this.commandList.length;
        this.updateCommandWindow();
        break;
      case "Enter":
        const selected = this.commandList[this.commandIndex];
        if (selected.label === "閉じる") {
          this.hideCommandWindow();
        } else {
          selected.action();
        }
        break;
      // ...他のキー
    }
  }

  @logMethod
  private handleSubCommandWindowInput(event: KeyboardEvent) {
    const subList = this.subCommandList;
    switch (event.key) {
      case "ArrowUp":
        this.subCommandIndex = (this.subCommandIndex + subList.length - 1) % subList.length;
        this.updateSubCommandWindow(this.subCommandList);
        break;
      case "ArrowDown":
        // サブコマンド選択を下に
        this.subCommandIndex = (this.subCommandIndex + 1) % subList.length;
        this.updateSubCommandWindow(this.subCommandList);
        break;
      case "Enter":
        const selected = subList[this.subCommandIndex];
        selected.action();
        break;
    }
    // ...他のキー
  }


  @logMethod
  private handleNormalInput(event: KeyboardEvent) {
    // 通常時の移動や操作
    switch (event.key) {
      case "i":
        if (this.commandWindowBox) {
          this.hideCommandWindow();
        } else {
          this.showCommandWindow();
        }
        break;
    }
    this.handleMove(event);
  }

  createItemCmdList(): Command[] {
    let cmdList = this.player.items.map((item, index): Command => {
      return {
        id: `item-${index}`,
        label: item.name,
        action: () => {
          log(`use item: ${item.name}`);
          getItemInfo(item.id)?.effect(this.player, item);
          this.player.items.splice(index, 1); // 使用後はリストから削除
          this.subCommandList = this.createItemCmdList(); // 更新
          this.updateSubCommandWindow(this.subCommandList);
        }
      };
    });

    cmdList.push({
      id: "close",
      label: "閉じる",
      action: () => this.hideSubCommandWindow()
    });

    return cmdList;
  }

}

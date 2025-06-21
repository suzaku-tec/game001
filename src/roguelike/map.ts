import * as ROT from 'rot-js'
import { Room } from './room'
import { getItemInfo, MapItem } from './item'
import { Trap } from './Trap'
import { MapEnemy } from './enemy'
import { ITEM_COLOR, TILE_SIZE } from '../constants'

export class MapData {
  scene: Phaser.Scene;
  map: number[][];
  rooms: Room[] = [];
  items: MapItem[] = [];
  traps: Trap[] = [];
  enemies: MapEnemy[] = [];
  stairsPos: { x: number, y: number };
  offsetY: number;

  constructor(scene: Phaser.Scene, width: number, height: number, offsetY: number = 0) {
    this.scene = scene;
    this.offsetY = offsetY;

    this.map = Array.from({ length: height }, () =>
      Array(width).fill(1)
    );

    const digger = new ROT.Map.Digger(width, height);
    digger.create((x, y, value) => {
      this.map[y][x] = value; // 0:通路, 1:壁
    });

    // 部屋情報を取得
    this.rooms = digger.getRooms().map((room: any) => new Room(
      room.getLeft(),
      room.getTop(),
      room.getRight() - room.getLeft() + 1,
      room.getBottom() - room.getTop() + 1
    ));

    // 階段の座標を決定（例：最後の部屋の中心）
    const lastRoom = this.rooms[this.rooms.length - 1];
    this.stairsPos = lastRoom.getCenter();

  }

  drawMap(offsetY: number) {
    const g = this.scene.add.graphics();
    g.clear();

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[0].length; x++) {
        const color = this.map[y][x] === 1 ? 0x333333 : 0xcccccc;
        g.fillStyle(color);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE + offsetY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  /**
   * 配置処理を行う関数
   * @param option 配置オプション
   * isItemPlaceCnt: アイテム配置数
   * isTrapPlaceCnt: 罠配置数
   * isEnemyPlaceCnt: 敵配置数
   */
  places({ isItemPlaceCnt = 0, isTrapPlaceCnt = 0, isEnemyPlaceCnt = 0 }: PlaceOption) {
    if (isItemPlaceCnt > 0) {
      this.placeItemsInRooms(isItemPlaceCnt);
    }

    if (isTrapPlaceCnt > 0) {
      this.placeTraps(isTrapPlaceCnt);
    }

    if (isEnemyPlaceCnt > 0) {
      this.placeEnemies(isEnemyPlaceCnt);
    }
  }

  /**
   * 罠を配置する関数
   * @param count 
   */
  placeTraps(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let tryCount = 0;
      while (true) {
        tryCount++;
        if (tryCount > 1000) break; // 無限ループ防止

        // ランダムな部屋を選ぶ
        const room = Phaser.Utils.Array.GetRandom(this.rooms);
        // 部屋内のランダムな座標
        x = Phaser.Math.Between(room.x + 1, room.x + room.w - 2);
        y = Phaser.Math.Between(room.y + 1, room.y + room.h - 2);

        // 出入口判定（例：部屋の端は出入口とみなす）
        const isEntrance =
          x === room.x + 1 || x === room.x + room.w - 2 ||
          y === room.y + 1 || y === room.y + room.h - 2;
        if (isEntrance) continue; // 出入口は罠を配置しない

        // アイテム、罠、階段、敵の存在チェック
        const result = this.existObstacle(x, y, { enemyChk: false });
        if (result) {
          this.traps.push({ x, y, type: "spike", visible: false });
          break;
        }
      }
    }
  }

  /**
   * 障害物の有無判定
   * @param x x座標
   * @param y y座標
   * @param option 判定オプション
   * @returns 判定結果 true: 障害物あり, false: 障害物なし
   */
  existObstacle(x: number, y: number, { itemChk = true, trapChk = true, stairsChk = true, enemyChk = true }: ExistObstacleOption): boolean {
    // マップの範囲外チェック
    if (x < 0 || x >= this.map[0].length || y < 0 || y >= this.map.length) {
      return true;
    }

    if (itemChk && this.existsItem(x, y)) {
      return true; // アイテムがある場合は障害物とみなす
    }

    if (trapChk && this.existsTrap(x, y)) {
      return true; // 罠がある場合は障害物とみなす
    }
    if (stairsChk && this.stairsPos.x === x && this.stairsPos.y === y) {
      return true; // 階段がある場合は障害物とみなす
    }

    if (enemyChk && this.enemies.find(enemy => enemy.x === x && enemy.y === y)) {
      return true; // 敵がいる場合は障害物とみなす
    }

    return false;
  }

  /**
   * 
   * @param x x座標
   * @param y y座標
   * @description 指定座標に敵が存在するかチェック
   * @returns 敵の有無 true: 敵あり, false: 敵なし
   */
  existsEnemy(x: number, y: number): boolean {
    // 指定座標に敵がいるかチェック
    return this.enemies.find(enemy => enemy.x === x && enemy.y === y) !== undefined;
  }

  /**
   * 
   * @param x x座標
   * @param y y座標
   * @description 指定座標に階段が存在するかチェック
   * @returns 階段の有無 true: 階段あり, false: 階段なし
   */
  existsStairs(x: number, y: number): boolean {
    // 階段の座標と一致するかチェック
    return this.stairsPos.x === x && this.stairsPos.y === y;
  }

  /**
   * アイテム存在判定
   * @param x x座標
   * @param y y座標
   * @description 指定座標にアイテムが存在するかチェック
   * @returns アイテムの有無 true: アイテムあり, false: アイテムなし
   */
  existsItem(x: number, y: number): boolean {
    // 指定座標にアイテムがあるかチェック
    return this.items.find(item => item.x === x && item.y === y) !== undefined;
  }

  /**
   * 罠の存在判定
   * @param x x座標
   * @param y y座標
   * @returns トラップの有無 true: 罠あり, false: 罠なし
   */
  existsTrap(x: number, y: number): boolean {
    // 指定座標に罠があるかチェック
    return this.traps.find(trap => trap.x === x && trap.y === y) !== undefined;
  }

  // 部屋にアイテムを配置
  placeItemsInRooms(count: number) {
    // 部屋の中心座標リストを作成
    const centers = this.rooms.map(room => room.getCenter());
    Phaser.Utils.Array.Shuffle(centers);

    // TODO;どうするか考える
    const item = getItemInfo(1)!;
    for (let i = 0; i < Math.min(count, centers.length); i++) {
      const pos = centers[i];
      this.items.push(new MapItem(this.scene, pos.x, pos.y, this.offsetY, item));
    }
  }

  placeEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let tryCount = 0;
      while (true) {
        tryCount++;
        if (tryCount > 1000) break; // 無限ループ防止

        // ランダムな部屋を選ぶ
        const room = Phaser.Utils.Array.GetRandom(this.rooms);
        // 部屋内のランダムな座標
        x = Phaser.Math.Between(room.x + 1, room.x + room.w - 2);
        y = Phaser.Math.Between(room.y + 1, room.y + room.h - 2);

        // アイテム、罠、階段、敵の存在チェック
        const result = this.existObstacle(x, y, {});
        if (result) continue; // 障害物がある場合は配置しない

        this.enemies.push(new MapEnemy(this.scene, x, y, this.offsetY));
        break;
      }
    }
  }

  drawTraps() {
    this.traps.forEach(trap => {
      // if (trap.visible) {
      if (true) {
        this.scene.add.rectangle(
          trap.x * TILE_SIZE + 8,
          trap.y * TILE_SIZE + 8 + this.offsetY,
          12,
          12,
          0xffA500
        );
      }
    });
  }

  drawStairs() {
    if (!this.stairsPos) return;
    this.scene.add.rectangle(
      this.stairsPos.x * TILE_SIZE + 8,
      this.stairsPos.y * TILE_SIZE + 8 + this.offsetY,
      12,
      12,
      0x8888ff // 階段の色（お好みで）
    );
  }

}

type ExistObstacleOption = {
  itemChk?: boolean;
  trapChk?: boolean;
  stairsChk?: boolean;
  enemyChk?: boolean
};

type PlaceOption = {
  isItemPlaceCnt?: number; // アイテム配置数
  isTrapPlaceCnt?: number; // 罠配置数
  isEnemyPlaceCnt?: number; // 敵配置数
}


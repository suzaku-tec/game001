import { EMIT_PLAYER_UPDATE } from "../constants";

export interface Status {
  /** 名前 */
  name: string;

  /** 体力 */
  hp: number;

  /** 魔力 */
  mp: number;

  /** 攻撃力 */
  atk: number;

  /** 防御力 */
  def: number;

  /** 器用さ */
  dex: number;

  /** 敏捷性 */
  agi: number;

  /** 知力 */
  int: number;

  /** 精神力 */
  mnd: number;

  /** 運 */
  luk: number;
}

export interface Position {
  /** X座標 */
  x: number;

  /** Y座標 */
  y: number;
}

export class Actor implements Status, Position {
  x: number;
  y: number;
  maxMp: number;
  maxHp: number;

  hp: number;
  mp: number;
  atk: number;
  def: number;
  dex: number;
  agi: number;
  int: number;
  mnd: number;
  luk: number;
  name: string;

  private emitter: Phaser.Events.EventEmitter;

  constructor(emitter: Phaser.Events.EventEmitter, x: number, y: number, status: Status) {
    this.emitter = emitter;

    this.name = status.name;
    this.x = x;
    this.y = y;
    this.hp = status.hp;
    this.maxHp = status.hp;
    this.mp = status.mp;
    this.maxMp = status.mp;
    this.atk = status.atk;
    this.def = status.def;
    this.dex = status.dex;
    this.agi = status.agi;
    this.int = status.int;
    this.mnd = status.mnd;
    this.luk = status.luk;
  }

  updateInfo() {
    this.emitter.emit(EMIT_PLAYER_UPDATE);
  }
}

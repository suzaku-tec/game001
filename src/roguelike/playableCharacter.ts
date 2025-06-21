import { Status } from "./actor";

interface PlayableGuid extends Status {
  id: string; // プレイヤーキャラクターの一意な識別子
}

const characters: PlayableGuid[] = [

  {
    id: "test",
    name: "テスト",
    hp: 30,
    mp: 10,
    atk: 3,
    def: 3,
    dex: 3,
    agi: 3,
    int: 3,
    mnd: 3,
    luk: 3
  },
  {
    id: "1",
    name: "AAA",
    hp: 30,
    mp: 10,
    atk: 5,
    def: 3,
    dex: 2,
    agi: 4,
    int: 1,
    mnd: 5,
    luk: 3
  },
];

// プレイヤーキャラクターを取得
export function getCharacter(id: string): Status | undefined {
  return characters.find((character) => character.id === id)
}

// 全てのプレイヤーキャラクターを取得
export function getAllCharacter(): Status[] {
  return characters;
}


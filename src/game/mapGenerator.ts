import * as ROT from "rot-js";
import { Room } from "../roguelike/room";

export const generateMap = (width: number, height: number): { map: number[][]; rooms: Room[] } => {
  const map: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(1)
  );

  const digger = new ROT.Map.Digger(width, height);
  digger.create((x, y, value) => {
    map[y][x] = value; // 0:通路, 1:壁
  });

  // 部屋情報を取得
  const rooms = digger.getRooms().map((room: any) => new Room(
    room.getLeft(),
    room.getTop(),
    room.getRight() - room.getLeft() + 1,
    room.getBottom() - room.getTop() + 1
  ));

  return { map, rooms };
};

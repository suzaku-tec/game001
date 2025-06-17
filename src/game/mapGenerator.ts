import * as ROT from "rot-js";

export const generateMap = (width: number, height: number): number[][] => {
  const map: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(1)
  );

  const digger = new ROT.Map.Digger(width, height);
  digger.create((x, y, value) => {
    map[y][x] = value; // 0:通路, 1:壁
  });

  return map;
};

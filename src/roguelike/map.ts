import * as ROT from 'rot-js'

export function generateMap(width: number, height: number): string[][] {
  const map: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => '#')
  )

  const digger = new ROT.Map.Digger(width, height)

  digger.create((x, y, value) => {
    map[y][x] = value === 0 ? '.' : '#'
  })

  return map
}

// Ember Vault — level data: three museum wings, each a tile map plus guard patrols.
// Legend: # wall, C crate (cover: blocks movement and sight), s shadow floor (dark = safe),
// . lit floor, L loot (a relic), P player start, E exit door.
export const TILE = 48;
export const COLS = 20;
export const ROWS = 13;

export const LEVELS = [
  {
    name: 'Wing 1 — The Marble Hall',
    briefing: 'Two guards walk the hall. Learn their route, stay in the shadows, take the relics.',
    map: [
      '####################',
      '#P...s....#....L..E#',
      '#..C.....#....C....#',
      '#....##......##....#',
      '#..s....C.......s..#',
      '#....##......##....#',
      '#..C.....#....C....#',
      '#....s...#....L....#',
      '#..................#',
      '#..C.....#....C....#',
      '#....s........s....#',
      '#..L.....#.....L...#',
      '####################',
    ],
    guards: [
      { tx: 10, ty: 4, patrol: [[10, 4], [10, 8], [5, 8], [5, 4]], pause: 1.2, speed: 52 },
      { tx: 15, ty: 9, patrol: [[15, 9], [15, 5], [18, 5], [18, 9]], pause: 1.0, speed: 48 },
    ],
  },
  {
    name: 'Wing 2 — The Gilded Gallery',
    briefing: 'Three guards, tighter patrols, more gold. The long gallery is lit — cross it only when the cone turns away.',
    map: [
      '####################',
      '#P.s..C....#...L..E#',
      '#....##....#..C....#',
      '#.C......C.....##..#',
      '#..s..##....s......#',
      '#....#....C....##..#',
      '#.C......#....C....#',
      '#..s..##....s......#',
      '#....#....C....##..#',
      '#.C......C.....#...#',
      '#..s..##....s.....L#',
      '#L....#....C....C..#',
      '####################',
    ],
    guards: [
      { tx: 6, ty: 3, patrol: [[6, 3], [6, 9], [3, 9], [3, 3]], pause: 0.9, speed: 56 },
      { tx: 13, ty: 2, patrol: [[13, 2], [13, 10], [16, 10], [16, 2]], pause: 1.1, speed: 54 },
      { tx: 8, ty: 6, patrol: [[8, 6], [8, 11], [12, 11], [12, 6]], pause: 1.4, speed: 50 },
    ],
  },
  {
    name: 'Wing 3 — The Ember Vault',
    briefing: 'The vault itself. Four guards, short sightlines, every relic counts. Reach the vault door unseen.',
    map: [
      '####################',
      '#P.s.C.....#...L..E#',
      '#..##...C..#..##...#',
      '#.C....##......C...#',
      '#..s..#..C..s..##..#',
      '#.##.....##....#...#',
      '#...C..s...C......L#',
      '#.##.....##....#...#',
      '#..s..#..C..s..##..#',
      '#.C....##......C...#',
      '#..##...C..#..##...#',
      '#L..s.C.....#...L..#',
      '####################',
    ],
    guards: [
      { tx: 5, ty: 2, patrol: [[5, 2], [5, 6], [2, 6], [2, 2]], pause: 0.8, speed: 60 },
      { tx: 14, ty: 3, patrol: [[14, 3], [14, 7], [17, 7], [17, 3]], pause: 1.0, speed: 58 },
      { tx: 8, ty: 5, patrol: [[8, 5], [7, 9], [13, 9], [13, 5]], pause: 1.2, speed: 56 },
      { tx: 7, ty: 10, patrol: [[7, 10], [13, 10], [13, 7], [7, 7]], pause: 0.9, speed: 62 },
    ],
  },
];

// Parse one level's map into walls, crates, shadow tiles, loot spots, player start and exit.
export function parseLevel(def) {
  const walls = new Set();
  const crates = new Set();
  const shadow = new Set();
  const loot = [];
  let player = { x: 1.5 * TILE, y: 1.5 * TILE };
  let exit = { x: 18.5 * TILE, y: 1.5 * TILE };
  def.map.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++) {
      const ch = row[tx];
      const key = tx + ',' + ty;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') crates.add(key);
      else if (ch === 's') shadow.add(key);
      else if (ch === 'L') loot.push({ tx, ty, x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, taken: false });
      else if (ch === 'P') player = { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
      else if (ch === 'E') exit = { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, tx, ty };
    }
  });
  return { walls, crates, shadow, loot, player, exit, name: def.name, briefing: def.briefing, guardDefs: def.guards };
}

export function tileKey(tx, ty) { return tx + ',' + ty; }

// True when the tile blocks movement (wall or crate).
export function isSolid(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  const key = tileKey(tx, ty);
  return level.walls.has(key) || level.crates.has(key);
}

// True when the tile blocks a guard's line of sight (wall or crate).
export function blocksSight(level, tx, ty) {
  return isSolid(level, tx, ty);
}

// Is the point (px, py) inside a shadow tile? Shadows hide the thief.
export function inShadow(level, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  return level.shadow.has(tileKey(tx, ty));
}

// Segment-vs-tile line of sight: sample along the segment, blocked by any solid tile.
export function hasLineOfSight(level, ax, ay, bx, by) {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist / 12));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (isSolid(level, Math.floor(x / TILE), Math.floor(y / TILE))) return false;
  }
  return true;
}

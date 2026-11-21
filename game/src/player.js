// Ember Vault — the thief: movement, sneaking, loot and the exit.
import { TILE, isSolid } from './levels.js';

export const WALK_SPEED = 175;
export const SNEAK_SPEED = 88;
export const PLAYER_RADIUS = 13;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2; // facing up the hall
    this.sneaking = false;
    this.moving = false;
    this.stepTimer = 0;
    this.stepPhase = 0;
    this.moveTarget = null; // mouse click-to-move destination, or null
    this.loot = 0;
    this.spottedOnce = false;
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.moveTarget = null;
    this.loot = 0;
    this.spottedOnce = false;
  }

  update(dt, level, input) {
    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    // A mouse click sets a walk target; any key press cancels it.
    if (dx !== 0 || dy !== 0) this.moveTarget = null;
    if (this.moveTarget && dx === 0 && dy === 0) {
      const mx = this.moveTarget.x - this.x;
      const my = this.moveTarget.y - this.y;
      const md = Math.hypot(mx, my);
      if (md < 8) this.moveTarget = null;
      else { dx = mx / md; dy = my / md; }
    }

    const len = Math.hypot(dx, dy);
    this.moving = len > 0;
    if (this.moving) {
      dx /= len;
      dy /= len;
      this.sneaking = !!input.sneak;
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      this.tryMove(level, dx * speed * dt, 0);
      this.tryMove(level, 0, dy * speed * dt);
      this.angle = Math.atan2(dy, dx);
      this.stepTimer += dt;
      if (this.stepTimer > (this.sneaking ? 0.55 : 0.32)) {
        this.stepTimer = 0;
        this.stepPhase += Math.PI;
        return true; // a footstep happened
      }
    }
    return false;
  }

  // Axis-separated movement so the thief slides along walls instead of sticking.
  tryMove(level, mx, my) {
    const nx = this.x + mx;
    const ny = this.y + my;
    if (!this.hitsSolid(level, nx, this.y)) this.x = nx;
    if (!this.hitsSolid(level, this.x, ny)) this.y = ny;
  }

  hitsSolid(level, x, y) {
    const r = PLAYER_RADIUS;
    for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      if (isSolid(level, Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE))) return true;
    }
    return false;
  }

  // Walked over a relic? Take it. Returns the loot taken, or null.
  collectLoot(level) {
    for (const item of level.loot) {
      if (!item.taken && Math.hypot(item.x - this.x, item.y - this.y) < 26) {
        item.taken = true;
        this.loot += 1;
        return item;
      }
    }
    return null;
  }

  // Close enough to the vault door to slip out?
  atExit(level) {
    return Math.hypot(level.exit.x - this.x, level.exit.y - this.y) < 30;
  }
}

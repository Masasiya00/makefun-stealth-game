// Ember Vault — guard patrol, vision cones and the suspicion system.
// A guard walks its waypoint loop, pauses at each corner, and watches a cone
// ahead of it. Seeing the thief fills suspicion; suspicion fills the alarm.
import { TILE, hasLineOfSight, inShadow } from './levels.js';

export const CONE_RANGE = 225;
export const CONE_HALF_ANGLE = 0.62; // ~71 degrees of vision, total
export const SUSPICION_RATE = 55; // per second, full view in the open
export const SUSPICION_DECAY = 26; // per second, hidden

export class Guard {
  constructor(def) {
    this.x = (def.tx + 0.5) * TILE;
    this.y = (def.ty + 0.5) * TILE;
    this.patrol = def.patrol.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
    this.pauseTime = def.pause;
    this.baseSpeed = def.speed;
    this.speed = def.speed;
    this.targetIndex = 1 % this.patrol.length;
    this.pauseLeft = 0;
    this.angle = Math.PI / 2; // facing down the hall at spawn
    this.suspicion = 0;
    this.state = 'patrol'; // patrol | suspicious | chase | search
    this.chaseLost = 0;
    this.searchLeft = 0;
    this.stepPhase = Math.random() * Math.PI * 2;
    this.stepTimer = 0;
    this.moving = false;
  }

  // Can this guard see the thief right now? Cone + range + line of sight.
  // Shadows and sneaking shrink the range; standing in the open at full
  // speed is the easiest way to be seen.
  canSee(level, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    let range = CONE_RANGE;
    if (inShadow(level, player.x, player.y)) range *= 0.55;
    if (player.sneaking) range *= 0.7;
    if (dist > range) return { seen: false, dist, clear: 0 };
    const angleTo = Math.atan2(dy, dx);
    let diff = angleTo - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > CONE_HALF_ANGLE) return { seen: false, dist, clear: 0 };
    if (!hasLineOfSight(level, this.x, this.y, player.x, player.y)) return { seen: false, dist, clear: 0 };
    // Closer and more centred in the cone = seen faster.
    const clarity = (1 - dist / range) * 0.6 + (1 - Math.abs(diff) / CONE_HALF_ANGLE) * 0.4;
    return { seen: true, dist, clear: clarity };
  }

  update(dt, level, player, alarm) {
    const seen = this.canSee(level, player);
    if (seen.seen) {
      const rate = SUSPICION_RATE * (0.5 + seen.clear);
      this.suspicion = Math.min(100, this.suspicion + rate * dt);
    } else {
      this.suspicion = Math.max(0, this.suspicion - SUSPICION_DECAY * dt);
    }

    // State changes from suspicion.
    if (this.suspicion >= 100) {
      if (this.state !== 'chase') { this.state = 'chase'; this.chaseLost = 0; }
    } else if (this.suspicion >= 45) {
      if (this.state === 'patrol') this.state = 'suspicious';
    } else if (this.state === 'suspicious') {
      this.state = 'patrol';
    }

    // Alarm at full tilt makes every guard walk faster.
    this.speed = this.baseSpeed * (alarm >= 100 ? 1.45 : alarm >= 60 ? 1.2 : 1);

    this.moving = false;
    if (this.state === 'chase') {
      this.moveToward(player.x, player.y, this.speed * 1.7, dt, level);
      if (!seen.seen) {
        this.chaseLost += dt;
        if (this.chaseLost > 2.5) { this.state = 'search'; this.searchLeft = 4; this.chaseLost = 0; }
      } else this.chaseLost = 0;
    } else if (this.state === 'search') {
      this.searchLeft -= dt;
      this.angle += dt * 1.6; // look around the spot where the thief vanished
      if (this.searchLeft <= 0) this.state = 'patrol';
    } else if (this.state === 'suspicious') {
      // Freeze and stare at the thief: the player's warning to move.
      this.angle = Math.atan2(player.y - this.y, player.x - this.x);
    } else {
      this.patrolStep(dt, level);
    }

    if (this.moving) {
      this.stepTimer += dt;
      if (this.stepTimer > 0.42) { this.stepTimer = 0; this.stepPhase += Math.PI; return true; }
    }
    return false;
  }

  // Walk the waypoint loop, pausing at each corner so the route is learnable.
  patrolStep(dt, level) {
    if (this.pauseLeft > 0) { this.pauseLeft -= dt; return; }
    const target = this.patrol[this.targetIndex];
    const arrived = this.moveToward(target.x, target.y, this.speed, dt, level);
    if (arrived) {
      this.targetIndex = (this.targetIndex + 1) % this.patrol.length;
      this.pauseLeft = this.pauseTime;
    }
  }

  moveToward(tx, ty, speed, dt, level) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    if (!this.hitsSolid(level, nx, this.y)) this.x = nx;
    if (!this.hitsSolid(level, this.x, ny)) this.y = ny;
    this.angle = Math.atan2(dy, dx);
    this.moving = true;
    return false;
  }

  hitsSolid(level, x, y) {
    const r = 13;
    for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      const tx = Math.floor((x + ox) / TILE);
      const ty = Math.floor((y + oy) / TILE);
      const key = tx + ',' + ty;
      if (level.walls.has(key) || level.crates.has(key)) return true;
    }
    return false;
  }

  // Cone colour follows suspicion: calm yellow, wary orange, hunting red.
  coneColor() {
    if (this.suspicion >= 100 || this.state === 'chase') return 'rgba(255,52,52,0.34)';
    if (this.suspicion >= 45) return 'rgba(255,166,32,0.30)';
    return 'rgba(255,224,102,0.20)';
  }

  coneEdgeColor() {
    if (this.suspicion >= 100 || this.state === 'chase') return 'rgba(255,80,80,0.75)';
    if (this.suspicion >= 45) return 'rgba(255,166,32,0.6)';
    return 'rgba(255,224,102,0.45)';
  }
}

// Build the guards of a parsed level.
export function buildGuards(level) {
  return level.guardDefs.map((def) => new Guard(def));
}

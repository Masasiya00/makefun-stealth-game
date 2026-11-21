// Ember Vault — all canvas drawing: the museum floor, vision cones, guards,
// the thief, loot and the exit. Lighting tells the story: dark shadow tiles
// are safe, lit floor and vision cones are dangerous.
import { TILE, COLS, ROWS } from './levels.js';
import { CONE_RANGE, CONE_HALF_ANGLE } from './guard.js';

export const VIEW_W = 960;
export const VIEW_H = 700;
export const PLAY_OY = 52; // HUD strip on top; the playfield starts here
export const PLAY_H = ROWS * TILE;

const FLOOR_A = '#2a2f45';
const FLOOR_B = '#262b40';
const SHADOW_FLOOR = '#141827';
const WALL_FILL = '#4a4238';
const WALL_TOP = '#6b5f4c';
const CRATE_FILL = '#7a5a33';
const CRATE_TOP = '#a07c46';

export function drawFloor(ctx, level) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      const key = tx + ',' + ty;
      if (level.walls.has(key)) {
        ctx.fillStyle = WALL_FILL;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(x, y, TILE, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
      } else if (level.crates.has(key)) {
        ctx.fillStyle = CRATE_FILL;
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = CRATE_TOP;
        ctx.fillRect(x + 4, y + 4, TILE - 8, 5);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + TILE - 4, y + TILE - 4);
        ctx.moveTo(x + TILE - 4, y + 4);
        ctx.lineTo(x + 4, y + TILE - 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
        ctx.fillRect(x, y, TILE, TILE);
        if (level.shadow.has(key)) {
          ctx.fillStyle = SHADOW_FLOOR;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = 'rgba(120,140,255,0.05)';
          ctx.fillRect(x, y, TILE, TILE);
        }
        // faint marble veining on lit floor
        if (!level.shadow.has(key)) {
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + TILE - 8);
          ctx.lineTo(x + TILE - 10, y + 10);
          ctx.stroke();
        }
      }
    }
  }
}

export function drawExit(ctx, level, time) {
  const e = level.exit;
  const pulse = 0.55 + Math.sin(time * 3) * 0.2;
  ctx.save();
  ctx.fillStyle = 'rgba(64,220,120,' + pulse * 0.25 + ')';
  ctx.fillRect(e.x - 26, e.y - 26, 52, 52);
  ctx.fillStyle = '#1d5c33';
  ctx.fillRect(e.x - 20, e.y - 22, 40, 44);
  ctx.fillStyle = '#3ddc78';
  ctx.fillRect(e.x - 20, e.y - 22, 40, 5);
  ctx.fillStyle = '#c9ffe0';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x, e.y - 28);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('➤', e.x, e.y + 8);
  ctx.restore();
}

export function drawLoot(ctx, level, time) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.5 + item.tx) * 3;
    const glow = 0.25 + Math.sin(time * 3 + item.ty) * 0.1;
    ctx.save();
    ctx.fillStyle = 'rgba(255,205,60,' + glow + ')';
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 20, 0, Math.PI * 2);
    ctx.fill();
    // a gold relic diamond
    ctx.fillStyle = '#ffd23c';
    ctx.beginPath();
    ctx.moveTo(item.x, item.y + bob - 11);
    ctx.lineTo(item.x + 9, item.y + bob);
    ctx.lineTo(item.x, item.y + bob + 11);
    ctx.lineTo(item.x - 9, item.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(item.x, item.y + bob - 11);
    ctx.lineTo(item.x + 4, item.y + bob - 2);
    ctx.lineTo(item.x - 4, item.y + bob - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawVisionCone(ctx, guard) {
  ctx.save();
  ctx.fillStyle = guard.coneColor();
  ctx.strokeStyle = guard.coneEdgeColor();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, CONE_RANGE, guard.angle - CONE_HALF_ANGLE, guard.angle + CONE_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawGuard(ctx, guard, time) {
  ctx.save();
  // body: a red-uniformed watchman, bright against the floor
  ctx.fillStyle = '#c22f2f';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 9, 0, Math.PI * 2);
  ctx.fill();
  // cap brim points where he looks
  ctx.fillStyle = '#c22f2f';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 12, guard.y + Math.sin(guard.angle) * 12, 5, 0, Math.PI * 2);
  ctx.fill();
  // state mark: ? while suspicious, ! while chasing
  if (guard.state === 'suspicious' || guard.suspicion >= 45) {
    ctx.fillStyle = '#ffb020';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 22);
  } else if (guard.state === 'chase') {
    ctx.fillStyle = '#ff3434';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 22);
  }
  // suspicion ring under the guard
  if (guard.suspicion > 1) {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 19, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = guard.suspicion >= 100 ? '#ff3434' : '#ffb020';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 19, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPlayer(ctx, player, time) {
  ctx.save();
  // soft shadow blob
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // hooded thief: dark cloak, pale face in the hood — kept light enough to
  // read against the dark floor at a glance
  ctx.fillStyle = player.sneaking ? '#3d4460' : '#4a5170';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8d9b0';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 5, player.y + Math.sin(player.angle) * 5, 6, 0, Math.PI * 2);
  ctx.fill();
  // cloak point behind
  ctx.fillStyle = player.sneaking ? '#2c3250' : '#3a415c';
  ctx.beginPath();
  ctx.moveTo(player.x - Math.cos(player.angle) * 12, player.y - Math.sin(player.angle) * 12);
  ctx.lineTo(player.x - Math.cos(player.angle) * 4 + Math.sin(player.angle) * 7, player.y - Math.sin(player.angle) * 4 - Math.cos(player.angle) * 7);
  ctx.lineTo(player.x - Math.cos(player.angle) * 4 - Math.sin(player.angle) * 7, player.y - Math.sin(player.angle) * 4 + Math.cos(player.angle) * 7);
  ctx.closePath();
  ctx.fill();
  if (player.sneaking) {
    ctx.fillStyle = '#9fb4ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', player.x, player.y - 20);
  }
  ctx.restore();
}

export function drawMoveTarget(ctx, target, time) {
  if (!target) return;
  const r = 6 + Math.sin(time * 6) * 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(159,180,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(target.x - 10, target.y);
  ctx.lineTo(target.x + 10, target.y);
  ctx.moveTo(target.x, target.y - 10);
  ctx.lineTo(target.x, target.y + 10);
  ctx.stroke();
  ctx.restore();
}

// Soft darkness at the playfield edges: the museum at night.
export function drawVignette(ctx) {
  const g = ctx.createRadialGradient(
    VIEW_W / 2, PLAY_OY + PLAY_H / 2, PLAY_H * 0.45,
    VIEW_W / 2, PLAY_OY + PLAY_H / 2, PLAY_H * 0.95,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, PLAY_OY, VIEW_W, PLAY_H);
}

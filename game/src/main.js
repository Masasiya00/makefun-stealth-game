// Ember Vault — game bootstrap and main loop: state machine, alarm, scoring,
// screenshot staging. Fixed-step simulation, requestAnimationFrame rendering.
import { LEVELS, parseLevel, TILE, ROWS } from './levels.js';
import { buildGuards } from './guard.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { SoundBoard } from './audio.js';
import {
  VIEW_W, VIEW_H, PLAY_OY,
  drawFloor, drawExit, drawLoot, drawVisionCone, drawGuard,
  drawPlayer, drawMoveTarget, drawVignette,
} from './render.js';
import { drawHud, drawFooter, drawTitle, drawPause, drawLevelClear, drawCaught, drawWin } from './ui.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const input = new Input(canvas);
const sound = new SoundBoard();

export const game = {
  screen: 'title', // title | play | pause | clear | caught | win
  levelIndex: 0,
  level: null,
  guards: [],
  player: null,
  alarm: 0,
  score: 0,
  totalLoot: 0,
  totalLootMax: 0,
  ghostRun: true,
  time: 0,
  levelTime: 0,
  statusText() {
    if (this.guards.some((g) => g.state === 'chase')) return 'HUNTED';
    if (this.guards.some((g) => g.suspicion >= 45)) return 'SPOTTED';
    return 'HIDDEN';
  },
};

function loadLevel(index) {
  game.levelIndex = index;
  game.level = parseLevel(LEVELS[index]);
  game.guards = buildGuards(game.level);
  game.player = new Player(game.level.player);
  game.alarm = 0;
  game.levelTime = 0;
  game.totalLootMax = LEVELS.reduce((n, def) => n + parseLevel(def).loot.length, 0);
}

function startGame() {
  game.score = 0;
  game.totalLoot = 0;
  game.ghostRun = true;
  loadLevel(0);
  game.screen = 'play';
  announce('Wing 1: The Marble Hall. Sneak to the exit.');
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = 'win';
    sound.winJingle();
    announce('You cleared all three wings. Final score ' + game.score);
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.screen = 'play';
  announce(game.level.name + '. ' + game.level.briefing);
}

function retryLevel() {
  loadLevel(game.levelIndex);
  game.screen = 'play';
  announce('Try the wing again.');
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

// Alarm: rises while any guard is suspicious or chasing, falls slowly while
// the thief is hidden. A near miss — a guard's suspicion crossing halfway —
// bumps it too. At 100 the guards walk faster and hunt harder.
function updateAlarm(dt) {
  const hottest = Math.max(0, ...game.guards.map((g) => g.suspicion));
  if (hottest >= 100) game.alarm = Math.min(100, game.alarm + 22 * dt);
  else if (hottest >= 45) game.alarm = Math.min(100, game.alarm + 8 * dt);
  else game.alarm = Math.max(0, game.alarm - 4 * dt);
}

function update(dt) {
  game.time += dt;
  if (game.screen !== 'play') return;
  game.levelTime += dt;

  const stepped = game.player.update(dt, game.level, input);
  if (stepped) sound.footstep(game.player.sneaking ? 0.12 : 0.25, true);

  const taken = game.player.collectLoot(game.level);
  if (taken) {
    game.score += 100;
    game.totalLoot += 1;
    sound.pickup();
    announce('Relic taken. ' + game.player.loot + ' of ' + game.level.loot.length + '.');
  }

  let prevHottest = 0;
  for (const guard of game.guards) {
    const before = guard.state;
    const guardStepped = guard.update(dt, game.level, game.player, game.alarm);
    if (guardStepped) {
      const dist = Math.hypot(guard.x - game.player.x, guard.y - game.player.y);
      sound.footstep(Math.max(0, 0.55 - dist / 600), false);
    }
    if (before !== 'chase' && guard.state === 'chase') {
      game.player.spottedOnce = true;
      game.ghostRun = false;
      game.alarm = Math.min(100, game.alarm + 18); // the near miss that raised the alarm
      sound.alert();
      announce('Spotted! Run for the shadows!');
    } else if (before === 'patrol' && guard.state === 'suspicious') {
      sound.suspicious();
    }
    prevHottest = Math.max(prevHottest, guard.suspicion);
  }

  updateAlarm(dt);

  // Caught: a chasing guard closes within arm's reach.
  for (const guard of game.guards) {
    if (guard.state === 'chase' && Math.hypot(guard.x - game.player.x, guard.y - game.player.y) < 26) {
      game.screen = 'caught';
      sound.alert();
      announce('Caught by a guard.');
      return;
    }
  }

  if (game.player.atExit(game.level)) {
    const ghostBonus = game.player.spottedOnce ? 0 : 500;
    const timeBonus = Math.max(0, 300 - Math.floor(game.levelTime) * 2);
    game.score += ghostBonus + timeBonus;
    game.screen = 'clear';
    sound.winJingle();
    announce('Wing clear. Score ' + game.score);
  }
}

function handleInput() {
  const pressed = input.takePressed();
  const click = input.takeClick();
  if (pressed.mute) {
    sound.ensure();
    const muted = sound.toggleMute();
    announce(muted ? 'Sound off.' : 'Sound on.');
  }
  if (pressed.restart && (game.screen === 'play' || game.screen === 'pause' || game.screen === 'caught')) {
    retryLevel();
    return;
  }
  if (game.screen === 'title') {
    if (pressed.confirm || click) { sound.ensure(); startGame(); }
    return;
  }
  if (game.screen === 'play') {
    if (pressed.pause) { game.screen = 'pause'; return; }
    if (click) {
      sound.ensure();
      const wx = click.x;
      const wy = click.y - PLAY_OY;
      if (wy >= 0 && wy < ROWS * TILE) game.player.moveTarget = { x: wx, y: wy };
    }
    return;
  }
  if (game.screen === 'pause') {
    if (pressed.pause || pressed.confirm || click) game.screen = 'play';
    return;
  }
  if (game.screen === 'clear') {
    if (pressed.confirm || click) nextLevel();
    return;
  }
  if (game.screen === 'caught') {
    if (pressed.confirm || click) retryLevel();
    return;
  }
  if (game.screen === 'win') {
    if (pressed.confirm || click) startGame();
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0b0d14';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (!game.level) { drawTitle(ctx, game); return; }

  ctx.save();
  ctx.translate(0, PLAY_OY);
  drawFloor(ctx, game.level);
  drawExit(ctx, game.level, game.time);
  drawLoot(ctx, game.level, game.time);
  for (const guard of game.guards) drawVisionCone(ctx, guard);
  drawMoveTarget(ctx, game.player.moveTarget, game.time);
  for (const guard of game.guards) drawGuard(ctx, guard, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawVignette(ctx);
  ctx.restore();

  drawHud(ctx, game);
  drawFooter(ctx);

  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'pause') drawPause(ctx);
  else if (game.screen === 'clear') drawLevelClear(ctx, game);
  else if (game.screen === 'caught') drawCaught(ctx, game);
  else if (game.screen === 'win') drawWin(ctx, game);
}

// Fixed 1/60 s steps, capped so a slow frame never spirals.
let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  handleInput();
  while (acc >= 1 / 60) {
    update(1 / 60);
    acc -= 1 / 60;
  }
  render();
  requestAnimationFrame(frame);
}

loadLevel(0);
game.screen = 'title';
stageShot(game, loadLevel);
// Test hook for automated playtests: lets a test read the live game state.
window.__ember = game;
requestAnimationFrame(frame);

// Ember Vault — HUD and full-screen states: title, pause, level clear,
// caught, and the final win screen. All drawn on the canvas, no DOM needed.
import { VIEW_W, VIEW_H, PLAY_OY, PLAY_H } from './render.js';

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,18,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function centerText(ctx, text, y, font, color) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
  ctx.restore();
}

// The top strip: wing name, loot, alarm meter, status, score.
export function drawHud(ctx, game) {
  ctx.save();
  ctx.fillStyle = '#12141f';
  ctx.fillRect(0, 0, VIEW_W, PLAY_OY);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, PLAY_OY - 2, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8d9b0';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(game.level.name, 12, 22);
  ctx.fillStyle = '#9aa3c0';
  ctx.font = '12px sans-serif';
  ctx.fillText('Loot ' + game.player.loot + '/' + game.level.loot.length + '   Score ' + game.score, 12, 40);

  // Alarm meter in the middle.
  const ax = 330;
  const aw = 300;
  ctx.fillStyle = '#3a2a2a';
  ctx.fillRect(ax, 12, aw, 16);
  const alarmColor = game.alarm >= 100 ? '#ff3434' : game.alarm >= 60 ? '#ff8c1a' : game.alarm >= 30 ? '#ffd23c' : '#3ddc78';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax, 12, aw * (game.alarm / 100), 16);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 12, aw, 16);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM ' + Math.round(game.alarm) + '%', ax + aw / 2, 40);

  // Status on the right: HIDDEN green, SEEN red, HUNTED flashing.
  const status = game.statusText();
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = status === 'HIDDEN' ? '#3ddc78' : status === 'SPOTTED' ? '#ffb020' : '#ff3434';
  ctx.fillText(status, VIEW_W - 12, 24);
  ctx.fillStyle = '#9aa3c0';
  ctx.font = '11px sans-serif';
  ctx.fillText('M mute   P pause', VIEW_W - 12, 41);
  ctx.restore();
}

export function drawFooter(ctx) {
  ctx.save();
  ctx.fillStyle = '#12141f';
  ctx.fillRect(0, PLAY_OY + PLAY_H, VIEW_W, VIEW_H - PLAY_OY - PLAY_H);
  ctx.fillStyle = '#9aa3c0';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move   ·   Shift sneak   ·   click to walk there   ·   dark tiles hide you   ·   reach the green EXIT', VIEW_W / 2, PLAY_OY + PLAY_H + 17);
  ctx.restore();
}

export function drawTitle(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,6,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'EMBER VAULT', 190, 'bold 64px sans-serif', '#ffd23c');
  centerText(ctx, 'A stealth game in three museum wings', 230, '18px sans-serif', '#e8d9b0');
  centerText(ctx, 'Slip past the guards. Pocket the relics. Reach the green EXIT unseen.', 270, '15px sans-serif', '#c8cede');
  centerText(ctx, 'Vision cones show what a guard can see — yellow is calm, orange is suspicious, red is hunting you.', 300, '15px sans-serif', '#c8cede');
  centerText(ctx, 'Dark floor tiles hide you. Sneak (Shift) to shrink a guard’s sight. A near miss raises the alarm.', 330, '15px sans-serif', '#c8cede');
  centerText(ctx, 'WASD / arrows to move · Shift to sneak · mouse click to walk · P pause · R restart', 380, '15px sans-serif', '#9fb4ff');
  centerText(ctx, 'Press ENTER or click to begin — Wing 1: The Marble Hall', 440, 'bold 18px sans-serif', '#3ddc78');
  centerText(ctx, 'An original game. No relic was harmed in the making of this heist.', 500, '12px sans-serif', '#77809a');
  ctx.restore();
}

export function drawPause(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,6,12,0.7)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'PAUSED', 300, 'bold 48px sans-serif', '#e8d9b0');
  centerText(ctx, 'Press P or click to keep sneaking · R restarts the wing', 350, '16px sans-serif', '#c8cede');
  ctx.restore();
}

export function drawLevelClear(ctx, game) {
  panel(ctx, VIEW_W / 2 - 260, 220, 520, 210);
  centerText(ctx, 'WING CLEAR', 275, 'bold 40px sans-serif', '#3ddc78');
  centerText(ctx, 'Loot ' + game.player.loot + '/' + game.level.loot.length + ' relics   ·   ' + (game.player.spottedOnce ? 'Spotted once — the guards remember.' : 'GHOST — never spotted! +500'), 315, '15px sans-serif', '#e8d9b0');
  centerText(ctx, 'Score ' + game.score, 350, 'bold 20px sans-serif', '#ffd23c');
  centerText(ctx, 'Press ENTER or click for the next wing', 395, '16px sans-serif', '#9fb4ff');
}

export function drawCaught(ctx, game) {
  panel(ctx, VIEW_W / 2 - 260, 220, 520, 210);
  centerText(ctx, 'CAUGHT!', 275, 'bold 44px sans-serif', '#ff3434');
  centerText(ctx, 'A guard laid hands on the thief. The relics stay in the museum… tonight.', 315, '15px sans-serif', '#e8d9b0');
  centerText(ctx, 'Score ' + game.score + '   ·   Wing ' + (game.levelIndex + 1) + ' of 3', 350, '16px sans-serif', '#ffd23c');
  centerText(ctx, 'Press ENTER or click to try the wing again', 395, '16px sans-serif', '#9fb4ff');
}

export function drawWin(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,6,12,0.8)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'THE VAULT IS YOURS', 240, 'bold 52px sans-serif', '#ffd23c');
  centerText(ctx, 'All three wings cleared. Every relic the museum owned now hangs in a better home.', 290, '17px sans-serif', '#e8d9b0');
  centerText(ctx, 'Final score ' + game.score + '   ·   Relics ' + game.totalLoot + '/' + game.totalLootMax, 340, 'bold 20px sans-serif', '#3ddc78');
  centerText(ctx, game.ghostRun ? 'GHOST RUN — never spotted, not once. A perfect heist.' : 'Spotted along the way — the guards will tell this story for years.', 380, '15px sans-serif', '#c8cede');
  centerText(ctx, 'Press ENTER or click to play again', 440, '16px sans-serif', '#9fb4ff');
  ctx.restore();
}

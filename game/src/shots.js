// Ember Vault — screenshot staging: ?shot=start|play|alarm|win puts the game
// in a fixed, photogenic state so every screenshot is a real render of the
// game's own code. ?seed is accepted and ignored: the game is deterministic
// without random loot or guard placement.

export function stageShot(game, loadLevel) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;
  if (shot === 'start') {
    game.screen = 'title';
    return;
  }
  if (shot === 'play') {
    loadLevel(0);
    game.screen = 'play';
    // Mid-heist: the thief crouched in shadow with two relics already pocketed,
    // a guard's cone sweeping past, the exit glowing ahead.
    game.player.x = 7.5 * 48;
    game.player.y = 8.5 * 48;
    game.player.sneaking = true;
    game.player.loot = 2;
    game.level.loot[0].taken = true;
    game.level.loot[1].taken = true;
    game.score = 200;
    game.guards[0].angle = Math.PI * 0.15;
    game.guards[0].suspicion = 12;
    game.guards[1].suspicion = 30;
    game.alarm = 18;
    return;
  }
  if (shot === 'alarm') {
    loadLevel(1);
    game.screen = 'play';
    // Spotted in the gallery: one guard chasing, cones red, alarm high.
    game.player.x = 10.5 * 48;
    game.player.y = 6.5 * 48;
    game.player.loot = 1;
    game.level.loot[0].taken = true;
    game.score = 100;
    const hunter = game.guards[0];
    hunter.x = 8.5 * 48;
    hunter.y = 6.5 * 48;
    hunter.state = 'chase';
    hunter.suspicion = 100;
    hunter.angle = 0;
    game.guards[1].suspicion = 62;
    game.guards[1].state = 'suspicious';
    game.alarm = 74;
    game.player.spottedOnce = true;
    game.ghostRun = false;
    return;
  }
  if (shot === 'win') {
    loadLevel(2);
    game.screen = 'win';
    game.score = 2450;
    game.totalLoot = 11;
    game.player.loot = 4;
    game.ghostRun = false;
    return;
  }
}

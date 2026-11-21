[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Masasiya00/makefun-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Masasiya00/makefun-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Ember Vault — a stealth game

Slip through a museum at night in three wings, pocket the relics, and reach
the green EXIT unseen. An original top-down stealth game for make.fun's
"Make the best stealth game" bounty — vanilla canvas JavaScript, no libraries,
no network requests, all sound synthesized with Web Audio.

## The game

- **Vision cones** — every guard sweeps a visible cone: yellow when calm,
  orange when suspicious, red when hunting. Cones are blocked by walls and
  crates, so cover is real.
- **Patrols you can learn** — guards walk waypoint loops and pause at each
  corner. Watch the route, then move.
- **Detection with a second chance** — being seen fills a guard's suspicion
  meter; at half it stops and stares (your warning), at full it chases.
  Break line of sight and suspicion drains.
- **Alarm meter** — rises while any guard is suspicious, falls while you stay
  hidden. At 100% every guard walks faster. A near miss bumps it up.
- **Shadows are safety** — dark floor tiles shrink a guard's sight range;
  sneaking shrinks it further.
- **Footsteps tell you where guards are** — synthesized steps get louder as
  a patrol closes in; alert stings and pickup chimes are synthesized too.
- **3 wings, 11 relics** — Marble Hall, Gilded Gallery, Ember Vault. Ghost
  bonus (+500) for clearing a wing never spotted; time bonus for speed.

## Controls

- **WASD / arrow keys** — move (mouse click also walks you there)
- **Shift** — sneak (slower, harder to see and hear)
- **P / Esc** — pause · **R** — restart wing · **M** — mute
- **Enter / click** — advance through title, wing-clear and win screens

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Files

- `game/index.html` + `game/src/` — the game: `main.js` (loop & states),
  `levels.js` (3 wings), `guard.js` (patrol & vision), `player.js`,
  `render.js`, `ui.js` (HUD & screens), `audio.js` (synthesized sound),
  `input.js`, `shots.js` (screenshot staging via `?shot=`)
- `main.ts` — hands the entry in: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` via `vendor/makefun-game.ts`

---

<sub>Entered on [make.fun](https://make.fun/?ref=cvw0cfes&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>

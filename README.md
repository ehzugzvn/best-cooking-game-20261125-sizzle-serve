# Sizzle & Serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ehzugzvn/best-cooking-game-20261125-sizzle-serve/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ehzugzvn/best-cooking-game-20261125-sizzle-serve/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A diner order-rush cooking game. You are the chef in a busy diner: orders land
on the board with patience timers, and you chop, grill, fry, plate and serve
before the customers walk out.

## How to play

Open `game/index.html` in a desktop browser — no build step, no network, all
art is drawn in code.

- **Move:** WASD or arrow keys (or tap a spot to walk there)
- **Use a station:** E, Space, or click the station
- **Bins (bottom):** grab bun, patty, lettuce, tomato, cheese, fries
- **Chopping board:** lettuce and tomato must be chopped first (stand close,
  it chops while you wait)
- **Grill:** raw patty cooks in 7s — grab it before it burns
- **Fryer:** raw fries cook in 6s — same burn risk
- **Plating counter:** stack ingredients into a dish; a finished recipe glows
- **Serving window:** serve a finished dish to the matching order

## Recipes

| Dish | Needs | Pays |
| --- | --- | --- |
| Classic Burger | bun + grilled patty + lettuce | $30 + tip |
| Cheese Burger | bun + grilled patty + cheese + lettuce | $40 + tip |
| Garden Salad | chopped lettuce + chopped tomato | $25 + tip |
| Fries Basket | crispy fries | $18 + tip |

Fast service earns a tip (up to $12, scaled by patience left). Lose 3 orders
and the shift ends; survive the full 3-minute shift to complete it. Orders
arrive faster and patience shrinks as the rush builds.

## Screenshots

`?shot=start` title screen, `?shot=play` mid-play with a dish mid-assembly,
`?shot=rush` the dinner rush, `?shot=serve` a finished plate ready to serve.
Add `?live=1` to unfreeze a staged scene.

## Structure

- `game/index.html` — page + main loop
- `game/src/config.js` — recipes, stations, tuning
- `game/src/input.js` — keyboard / mouse / touch
- `game/src/state.js` — orders, timer, score
- `game/src/world.js` — movement, stations, cooking, spawning
- `game/src/render.js` — canvas drawing
- `game/src/audio.js` — tiny WebAudio bleeps
- `game/src/shots.js` — deterministic `?shot=` scenes
- `main.ts` — copies `game/` + `screenshots/` to the output dir and writes
  `dossier.json` via `vendor/makefun-game.ts`

## License

MIT — see `LICENSE`.

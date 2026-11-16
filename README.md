# SIGNAL BREACH

[![make.fun competition](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/competitions/threejs-fps-02)
[![Live rank](https://make.fun/badge/threejs-fps-02/Ajnsnsn/signal-breach-tactical-fps/rank.svg)](https://make.fun/competitions/threejs-fps-02)
[![Live reward](https://make.fun/badge/threejs-fps-02/Ajnsnsn/signal-breach-tactical-fps/reward.svg)](https://make.fun/competitions/threejs-fps-02)

An original, offline, three.js tactical FPS set at **Pelagic Relay**, a sunlit offshore communication station. Two teams of three compete to breach or protect its two relay sites. First to five rounds wins; the player changes sides every three rounds.

## Play

Requires desktop Chrome with WebGL2 and a mouse/keyboard. No install or build step.

    node serve.ts

Open http://127.0.0.1:8080, choose **Begin Operation**, buy equipment, then **Deploy**. The game captures the mouse when you deploy. Escape releases it and pauses the simulation. Click Resume to continue. If mouse capture is unavailable, select **Play with Drag Look** in the pause panel: hold the right mouse button while dragging to aim; left click fires. Escape pauses either control mode. Buy phases wait for deployment so there is time to choose equipment.

- WASD: move; mouse: look; left click: fire; right click: focus.
- Shift: silent walk; Ctrl or C: crouch. Stop moving for accurate shots.
- R: reload; 1: primary; 2: sidearm; G: throw frag; M: mute.
- E: hold to plant (3 seconds) or defuse (5 seconds).
- B: requisition between rounds; Enter: deploy; Escape: pause.
- Sensitivity, mute and restart are available from the pause menu.

Raiders carry a charge to either relay. A dropped charge can be recovered by approaching it. After planting, protect it for 35 seconds. Custodians can win by defusing or preventing a plant until the round timer runs out. Elimination also wins a round, except the last raider's death does not cancel an armed charge. Fallen players spectate a living squadmate until the next round.

## Tactical systems

Four distinct weapons have finite magazines/reserves, reload times, recoil and movement spread. Head/body ray hits respect cover height. Movement accelerates and slides along the shared map collision geometry. Armor absorbs 35% of incoming damage until exhausted. Grenades bounce, have a 1.8-second fuse and a 7-meter blast; walls obstruct damage and friendly fire is possible.

Bots use a collision-aware navigation graph, sight cones, line-of-sight checks, reaction time, hearing, aim settling, cover holding, route decisions and objective interaction. Quiet walking and crouching suppress footstep noise. Both teams can finish the objective without the player, and only one operative can own the defuse interaction at a time.

Credits come from round results, enemy eliminations and planting. Equipment survives a round if the player survives. Death loses the primary and armor. Requisition offers an SMG, rifle, marksman weapon, armor and frag charges.

## Implementation and validation

- `game/src/sim.js`: deterministic 60 Hz simulation, rounds, combat, economy and bot decisions.
- `game/src/physics.js`: ray tests, height-aware visibility, sliding collision and navigation.
- `game/src/layout.js`: single source of truth for physical walls and relay positions.
- `game/src/world.js`: original procedural coastal architecture and materials.
- `game/src/view.js`: three.js rendering, first-person equipment and pooled visual effects.
- `game/src/hud.js`, `audio.js`, `main.js`: interface, procedural audio and input/loop.

Run `npm test` for logic checks. The read-only `window.signalBreach.snapshot()` and `renderer()` methods support browser QA without altering gameplay. Rendered frames do not advance the simulation; fixed updates do. Hidden or unlocked gameplay pauses.

The maker screenshots in `screenshots/` are unedited browser captures of this game. No borrowed image, sound, model, commercial map or starter gameplay code is used.

## Submission build

`main.ts` runs with Node's standard library only and copies the static game and screenshots to `/output`. Set `MAKEFUN_OUTPUT_DIR` for local packaging. It calls the official unchanged `vendor/makefun-threejs.ts` to produce the deterministic dossier.

The only external source dependencies are the competition's official, unchanged three.js 0.187.0 files and dossier helper. All runtime assets are local. The official make.fun helper license is retained under `vendor/LICENSE`. The official three.js license is retained under `game/vendor/three/LICENSE`.

## License and creation

Original game source, procedural geometry, canvas markings, interface and synthesized audio: MIT, copyright 2026 nandi-kawe. The entry was created with OpenAI Codex assistance. No generated raster assets or third-party gameplay code were used. See `LICENSE` for the license.


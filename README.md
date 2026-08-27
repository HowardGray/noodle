# Noodle

A snake arena for a five-year-old. It looks and plays like Snake.io — floating
joystick, boost button, bead-chain snakes with cartoon faces, hex arena,
leaderboard with a crown on first place.

One thing is different, and it is the whole point: **nothing can kill you.**

## Rounds

Each round has a points target. Hit it and you win the round and choose one of
three new snakes; run out of lives and you retry the same round with everything
you have unlocked still yours. Lives reset every round, so a loss costs one
round rather than an evening.

Targets and pressure climb together — round 1 asks for 15 sweets against 8 bots,
round 10 asks for 60 against 16 with two thirds of them hunting. Ten rounds
unlock all ten snakes, then it runs on with the target rising.

Lose the same round three times and it quietly gets easier: fewer bots, fewer
hunters, a lower target. Nothing on screen says so. He still won it.

Skins are cosmetic. Progress, name, chosen snake and best score live in
localStorage.

## Two players, one screen

Optional, off by default — flip the toggle on the start screen and a second
name field appears. **Desktop for now:** player one steers with the arrow keys
and boosts with space, player two steers with WASD and boosts with left shift.
Touch still drives player one only; two thumbs on one piece of glass is the next
step.

It is co-operative. One camera pulls back far enough to hold both snakes, a soft
leash stops either of you wandering out of frame, and you share the lives and
the sweet count — so you win the round together or lose it together. Neither of
you can hurt the other.

## The rules

- **The wall never kills.** You reach the edge and simply cannot go further.
- **Bumping any part of a snake costs one of three lives**, plays a soft noise,
  and knocks you the other way, with a second and a bit of safety after so one
  pile-up cannot take the lot.
- **Your length has a floor.** It can never drop below eight beads, so a bad
  patch can't leave you with nothing.
- **The leaderboard always shows you**, pinned with your real rank even when you
  are last. Bots start bigger than you do, so a plain top five would leave you
  off it for the part of a round you most want feedback on.
- **Bots that hit *your* body burst into sweets.** You can win. You cannot lose.
- **Every sweet plays the next note up a major pentatonic scale**, so a good run
  composes a little tune and nothing you play can sound wrong.

## Why it's built this way

Snake.io's own fail state is the problem at this age: instant death, restart from
nothing, and it speeds up exactly as a child gets invested. Everything else about
it — the controls, the arena, the leaderboard, the growing — already works, and
he already knows it. So the loop is kept and the punishment is removed.

Control scheme is Snake.io's for the same reason. A floating joystick appears
wherever a thumb lands, and the boost button stays in one place, thumb-sized.

Background reading that led here is in [RESEARCH.md](RESEARCH.md) — a scan of the
eighteen biggest Snake games on iOS, with screenshots in `research/`.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173, --host so a phone on the wifi can reach it
npm run build
npm run preview
```

No framework, no engine. TypeScript, one canvas, Vite.

| File | Does |
| --- | --- |
| `src/world.ts` | Snakes, bots, pellets, collisions, the never-dies rules |
| `src/render.ts` | Camera, arena, snakes, HUD, joystick |
| `src/input.ts` | Floating joystick, boost button, keyboard for desktop |
| `src/audio.ts` | The pentatonic scale and the other sounds |
| `src/skins.ts` | Snake skins, arena colours, bot names |
| `src/progress.ts` | Saved state, round difficulty curve, skin offers |
| `src/music.ts` | Background track loading and the picker's playback |

## Putting it on an iPad or iPhone

Open the deployed URL in **Safari**, tap the Share button, then **Add to Home
Screen**. It then launches full screen with no browser chrome, works with no
signal, and behaves like an app. Safari is required — Chrome on iOS cannot
install web apps.

Audio needs one tap before it will make a sound; that is what the play button is
for, and iOS gives no way around it.

## Music

Tracks are generated ahead of time and committed as files. A static site cannot
call a music API at runtime without publishing the API key to every visitor.

```bash
ELEVENLABS_API_KEY=sk_... npm run music
```

That writes four 60-second loops into `public/music/` and rewrites
`tracks.json`. The picker on the start screen appears only when that file lists
at least one track, so the game ships fine with none.

Costs about 3,600 credits for all four (Eleven Music bills 900 credits a minute
from the shared pool), which fits inside a $6/month Starter plan. Prompts live at
the top of `scripts/make-music.mjs` — edit and re-run to try different moods.

One licensing note: ElevenLabs includes broad commercial use on paid plans, but
their terms carve out film, TV and large-studio game rights as Enterprise-only.
Fine for a game you and your son play; worth re-reading if it ever ships
commercially.

## Not built yet

- **Two players on a touchscreen.** The keyboard version works; two thumbs on
  one iPad needs a second on-screen stick and a decision about where it lives.
- Power-ups — magnet, shield, ghost, double sweets.
- Boost that visibly drops mass behind you, the way Snake.io's does.
- A snake designer, so he can build his own instead of picking from ten.
- Haptics, which iOS Safari does not offer. Would need a native wrapper.

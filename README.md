# Noodle

A snake arena for a five-year-old. It looks and plays like Snake.io — floating
joystick, boost button, bead-chain snakes with cartoon faces, hex arena,
leaderboard with a crown on first place.

One thing is different, and it is the whole point: **nothing can kill you.**

## The rules

- **The wall never kills.** You reach the edge and simply cannot go further.
- **Bumping a snake costs a little length**, plays a soft noise, and knocks you
  the other way. Then you carry on. There is no game over screen anywhere.
- **Your length has a floor.** It can never drop below eight beads, so a bad
  patch can't leave you with nothing.
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

- **Two players on one device.** The reason to build this at all — two snakes,
  one iPad, a thumb each. The world already holds multiple snakes, so this is
  mostly input and a split camera.
- Skin picking. `src/skins.ts` has ten; the player always gets Rainbow.
- Haptics, which iOS Safari does not offer. Would need a native wrapper.

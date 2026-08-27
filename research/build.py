import json, base64, html, os

TPL = "/private/tmp/claude-501/-Users-howardgray-Desktop-Personal-HG-Projects-Consulting-TikTok-tiktok-aug26-workshop-gallery/92d9c51c-c998-4afe-9b05-d55a2c53b8da/scratchpad/snake-template.html"
OUT = "/Users/howardgray/Desktop/Personal/HG Projects/Games/snake/snake-landscape.html"

meta = json.load(open("shortlist-meta.json"))

# --- table rows (shortlist + a few extras pulled from raw) ---
raw = json.load(open("raw-snake-us.json"))
byid = {r["trackId"]: r for r in raw["results"]}
EXTRA = [6443553808, 6751716734]  # Snake.io+, Wiggle Escape
rows = []
for slug, v in meta.items():
    rows.append((v["trackName"], v["sellerName"], v["averageUserRating"], v["userRatingCount"],
                 v["releaseDate"][:7], v["currentVersionReleaseDate"][:7]))
for tid in EXTRA:
    r = byid[tid]
    rows.append((r["trackName"], r["sellerName"], r["averageUserRating"], r["userRatingCount"],
                 r["releaseDate"][:7], r["currentVersionReleaseDate"][:7]))
rows.sort(key=lambda r: -r[3])

MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
def ym(s):
    y, m = s.split("-"); return f"{MON[int(m)-1]} {y}"

def clean(name):
    for cut in [" - ", " — ", ": ", "・"]:
        if cut in name: name = name.split(cut)[0]
    return name.strip()

trs = []
for name, seller, star, cnt, rel, upd in rows:
    seller = seller.replace(" INC.","").replace(" Inc.","").replace(" LLC","").replace(" Ltd","") \
                   .replace(" LIMITED","").replace(" Limited","").replace(" GmbH","").replace(" PTE. LTD.","") \
                   .replace(" (HK) TECHNOLOGY CO., LIMITED","").replace(" B.V.","").replace(", Inc","")
    if len(seller) > 26: seller = seller[:24].title().rstrip() + "…"
    trs.append(
        f'<tr><td class="name">{html.escape(clean(name))}</td><td>{html.escape(seller)}</td>'
        f'<td class="n">{star:.2f}</td><td class="n">{cnt:,}</td>'
        f'<td>{ym(rel)}</td><td>{ym(upd)}</td></tr>')
TABLE = "\n".join(trs)

# --- genre bands ---
def img(slug):
    b = base64.b64encode(open(f"strips/{slug}.jpg","rb").read()).decode()
    return f"data:image/jpeg;base64,{b}"

def cap(slug):
    v = meta[slug]
    return clean(v["trackName"]), v["sellerName"], v["averageUserRating"], v["userRatingCount"]

BANDS = [
 dict(id="io", title="The .io arena", weight=764001,
      titles=["snake-io","snakerio-voodoo","worms-zone","insatiable-io","little-big-snake","snake-io-netflix"],
      body="""<p>Slither.io's descendants, and the lane most people picture when they hear "modern snake". Top-down 2D, free-angle steering, boost by ejecting mass behind you, and you kill not by hitting someone but by making <em>them</em> hit <em>you</em>. Instant respawn, no fail screen worth the name. Money comes from rewarded-video revives, skin gacha and a battle pass.</p>
<p>Snake.io launched in April 2016 and shipped an update ten days before this scan. Netflix licensed it for their games tier. Kooapps run a second paid-tier build on Apple Arcade. This lane is defended.</p>"""),
 dict(id="clash", title="The clash treadmill", weight=773920,
      titles=["snake-clash"],
      body="""<p>The single biggest number on the board, and the newest thing that got there: 774,000 ratings in three years against Snake.io's 473,000 in ten. Supercent did not change the loop. They bolted a persistent <strong>level number</strong> onto the snake and a boss ladder onto the session — <span class="mono">Lv 182 Player</span> chasing <span class="mono">BOSS Lv 1000</span> against a 1:23 clock.</p>
<p>That is the hybrid-casual playbook applied to snake: hypercasual session, meta-progression underneath it so the numbers keep climbing between runs. It is where the growth in this category currently lives.</p>"""),
 dict(id="3d", title="The 3D arena", weight=143814,
      titles=["snake-rivals","boas-io","snake-master-3d"],
      body="""<p>Same loop, third-person camera, battle-royale framing. Boas.io has the best idea in the lane — you swallow a <em>city</em>, cars and buildings and whole blocks at a time, which is a genuinely funny escalation of "eat the pellet".</p>
<p>But 3D makes snake's central legibility problem worse rather than better. You cannot see your own tail, and your own tail is the thing that kills you. Note the ratings: the whole lane put together does not reach a fifth of Snake Clash!, and Snake Master 3D has not been touched since May 2021.</p>"""),
 dict(id="remix", title="The mechanic remix", weight=740796,
      titles=["snake-vs-block","snake-run-race","sssnaker"],
      body="""<p>Keep the one idea worth keeping — your body <em>is</em> your length — and throw the grid away completely. Length becomes ammunition fired at numbered blocks (Snake VS Block), a runner's queue of segments you gain and lose down a track (Snake Run Race), or a bullet-hell shooter where the tail is your health bar and your damage output at the same time (SSSnaker).</p>
<p>Best return on invention anywhere in this scan. Snake VS Block is one mechanic from a 2017 Voodoo prototype and it is still, nine years later, the second-biggest game on the board.</p>"""),
 dict(id="untangle", title="The untangle puzzle", weight=140107,
      titles=["tangled-snakes","snake-escape-tap-away"],
      body="""<p>The current gold rush. No real-time skill at all: the snakes are knotted, and you tap them out in the order that lets each one leave without crossing another. Snake Escape launched in October 2025 and has 16,500 ratings at 4.79★ ten months later.</p>
<p>Worth being honest about what this is. Snake is a <em>skin</em> stretched over the unblock / tap-away puzzle template that is currently eating the casual puzzle charts — the same machine that produced Color Block Jam and Screwdom. Fast money, brutally crowded, and not really our game.</p>"""),
 dict(id="thinky", title="The thinky grid puzzle", weight=3186,
      titles=["snake-puzzle-slither","snaggle"],
      body="""<p>Deterministic, turn-based, one correct solution, no clock. This is the lineage that produced the genre's masterpiece — Snakebird, 85 on Metacritic — and it has, on iOS, the smallest audience here by two full orders of magnitude.</p>
<p>Snaggle is the one to sit with. A properly designed multi-snake path-drawing game, 4.83★ from the twenty-three people who found it, last updated March 2019. Highest craft on the board, no distribution, dead.</p>"""),
 dict(id="relic", title="The relic", weight=4113,
      titles=["snake-97"],
      body="""<p>Snake '97 renders the game inside a photographed Nokia bezel — 5110, 3210, 3310, 8210, 8850, 7110 — with the keypad attached and the monotone bleeps intact. Nine original difficulty levels, both Snake 1 and Snake 2, the labyrinths, going through the walls.</p>
<p>It is fifteen years old, rated 4.73★, and was updated this February. Nostalgia is a durable niche and it is already served perfectly. There is nothing to take here except the reminder that the monochrome screen is the only art direction in this whole scan that anybody remembers.</p>"""),
]

MAXW = max(b["weight"] for b in BANDS)
out = []
for b in BANDS:
    figs = []
    for s in b["titles"]:
        n, sel, st, ct = cap(s)
        figs.append(
          f'<figure class="strip"><figcaption><span class="t">{html.escape(n)}</span>'
          f'<span class="m">{html.escape(sel[:30])}</span>'
          f'<span class="m">{st:.2f}★ · {ct:,} ratings</span></figcaption>'
          f'<div class="scroll"><img src="{img(s)}" alt="App Store screenshots for {html.escape(n)}"></div></figure>')
    pct = round(100 * b["weight"] / MAXW, 1)
    out.append(f'''<div class="band" id="{b['id']}">
<div class="band-head">
  <div><h3>{b['title']}</h3><div class="prose">{b['body']}</div></div>
  <div class="weight">
    <span class="num">{b['weight']:,}</span>
    <div class="bar"><i style="width:{pct}%"></i></div>
    <span class="label cap">US ratings across<br>scanned titles in lane</span>
  </div>
</div>
{''.join(figs)}
</div>''')

tpl = open(TPL).read().replace("{{TABLE}}", TABLE).replace("{{BANDS}}", "\n".join(out))
open(OUT,"w").write(tpl)
print("wrote", OUT, round(os.path.getsize(OUT)/1e6,2), "MB")
